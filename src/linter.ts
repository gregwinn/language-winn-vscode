import * as vscode from "vscode";
import * as cp from "child_process";
import * as path from "path";
import { parseCompilerOutput } from "./outputParser";

let debounceTimer: NodeJS.Timeout | undefined;
let activeProcess: cp.ChildProcess | undefined;

export function lint(
  document: vscode.TextDocument,
  diagnosticCollection: vscode.DiagnosticCollection
): void {
  // Only lint .winn files
  if (document.languageId !== "winn") return;

  const config = vscode.workspace.getConfiguration("winn");
  if (!config.get<boolean>("lintOnSave", true)) return;

  // Debounce: cancel pending lint, wait 300ms
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    runCompiler(document, diagnosticCollection);
  }, 300);
}

function runCompiler(
  document: vscode.TextDocument,
  diagnosticCollection: vscode.DiagnosticCollection
): void {
  // Kill any in-flight compile
  if (activeProcess) {
    activeProcess.kill();
    activeProcess = undefined;
  }

  const config = vscode.workspace.getConfiguration("winn");
  const compilerPath = config.get<string>("compilerPath", "winn");
  const filePath = document.uri.fsPath;
  const cwd = path.dirname(filePath);

  // Use a temp output dir so we don't pollute the project
  const tmpDir = require("os").tmpdir();

  activeProcess = cp.execFile(
    compilerPath,
    ["compile", filePath],
    {
      cwd,
      timeout: 10000,
      env: { ...process.env, TMPDIR: tmpDir },
    },
    (error, _stdout, stderr) => {
      activeProcess = undefined;

      if (!stderr && !error) {
        // Clean compile — clear diagnostics
        diagnosticCollection.set(document.uri, []);
        return;
      }

      const output = stderr || "";
      const parsed = parseCompilerOutput(output);

      if (parsed.length === 0 && error) {
        // Compiler crashed or not found — show a single diagnostic
        const diag = new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 0),
          `Winn compiler error: ${error.message}`,
          vscode.DiagnosticSeverity.Error
        );
        diagnosticCollection.set(document.uri, [diag]);
        return;
      }

      const diagnostics = parsed.map((d) => {
        // VS Code lines are 0-indexed, compiler lines are 1-indexed
        const line = Math.max(0, d.line - 1);
        const range = new vscode.Range(line, 0, line, 1000);
        const diag = new vscode.Diagnostic(range, d.message, d.severity);
        diag.source = "winn";
        return diag;
      });

      diagnosticCollection.set(document.uri, diagnostics);
    }
  );
}

export function dispose(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  if (activeProcess) activeProcess.kill();
}

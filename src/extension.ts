import * as vscode from "vscode";
import { lint, dispose as disposeLinter } from "./linter";

let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext): void {
  diagnosticCollection = vscode.languages.createDiagnosticCollection("winn");
  context.subscriptions.push(diagnosticCollection);

  // Lint on save
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((document) => {
      if (document.languageId === "winn") {
        lint(document, diagnosticCollection);
      }
    })
  );

  // Clear diagnostics when a file is closed
  context.subscriptions.push(
    vscode.workspace.onDidCloseTextDocument((document) => {
      diagnosticCollection.delete(document.uri);
    })
  );

  // Lint any already-open .winn files
  if (vscode.window.activeTextEditor?.document.languageId === "winn") {
    lint(vscode.window.activeTextEditor.document, diagnosticCollection);
  }
}

export function deactivate(): void {
  disposeLinter();
}

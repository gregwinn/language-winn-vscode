import * as vscode from "vscode";

export interface WinnDiagnostic {
  line: number;
  message: string;
  severity: vscode.DiagnosticSeverity;
  hint?: string;
}

/**
 * Parse the stderr output from `winn compile` into diagnostics.
 *
 * The compiler outputs errors in this format (no ANSI when not a TTY):
 *
 *   -- Syntax Error ----------------------------- file.winn --
 *
 *    14 |   x = compute()
 *    15 |   end end
 *        |   ^^^
 *     Unexpected 'end'.
 *     Hint: Did you close a block too early?
 *
 */
export function parseCompilerOutput(stderr: string): WinnDiagnostic[] {
  // Strip any ANSI escape codes (safety, shouldn't be present in subprocess)
  const clean = stderr.replace(/\x1b\[[0-9;]*m/g, "");
  const diagnostics: WinnDiagnostic[] = [];

  // Split into error blocks by the header line pattern
  const blocks = clean.split(/^(-- .+ --\s*$)/m);

  for (let i = 1; i < blocks.length; i += 2) {
    const header = blocks[i];
    const body = blocks[i + 1] || "";

    // Extract title from header: "-- Syntax Error --- file.winn --"
    const titleMatch = header.match(/^--\s+(.+?)\s+-+\s+.+\s+--\s*$/);
    const title = titleMatch ? titleMatch[1].trim() : "Error";

    // Determine severity
    const severity = /warning/i.test(title)
      ? vscode.DiagnosticSeverity.Warning
      : vscode.DiagnosticSeverity.Error;

    // Find the error line number: look for the line with just a number and pipe
    // that is NOT a context line. The error line has the number at normal indent.
    // Pattern: lines like " 15 | code here"
    const lineNumbers: number[] = [];
    const lineRegex = /^\s*(\d+)\s+\|/gm;
    let lineMatch;
    while ((lineMatch = lineRegex.exec(body)) !== null) {
      lineNumbers.push(parseInt(lineMatch[1], 10));
    }

    // The caret line follows the error line: "     | ^^^"
    const caretIdx = body.indexOf("| ^");
    let errorLine = 1;

    if (caretIdx >= 0 && lineNumbers.length > 0) {
      // The error line is the last line number before the caret
      const beforeCaret = body.substring(0, caretIdx);
      const beforeLines = beforeCaret.match(/^\s*(\d+)\s+\|/gm);
      if (beforeLines && beforeLines.length > 0) {
        const lastMatch = beforeLines[beforeLines.length - 1].match(/(\d+)/);
        if (lastMatch) {
          errorLine = parseInt(lastMatch[1], 10);
        }
      }
    } else if (lineNumbers.length > 0) {
      // Fallback: use the first line number found
      errorLine = lineNumbers[0];
    }

    // Extract message: lines after the caret that start with 2 spaces and a non-space
    const messageLines: string[] = [];
    let hint: string | undefined;
    const bodyLines = body.split("\n");
    let pastCaret = false;

    for (const line of bodyLines) {
      if (line.includes("| ^")) {
        pastCaret = true;
        continue;
      }
      if (pastCaret) {
        const trimmed = line.trim();
        if (trimmed === "") continue;
        if (trimmed.startsWith("Hint:")) {
          hint = trimmed.replace(/^Hint:\s*/, "");
        } else if (trimmed.length > 0) {
          messageLines.push(trimmed);
        }
      }
    }

    // If no message found after caret, look for any indented message in body
    if (messageLines.length === 0) {
      for (const line of bodyLines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.match(/^\d+\s+\|/) && !trimmed.startsWith("--") && !trimmed.includes("| ^")) {
          messageLines.push(trimmed);
          break;
        }
      }
    }

    let message = messageLines.join(" ") || title;
    if (hint) {
      message += ` (${hint})`;
    }

    diagnostics.push({
      line: errorLine,
      message,
      severity,
      hint,
    });
  }

  return diagnostics;
}

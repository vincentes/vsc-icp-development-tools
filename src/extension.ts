import {
  commands,
  ExtensionContext,
  TextDocument,
  window,
  workspace,
} from "vscode";

const terminalName = "dfx: status";

export function activate(context: ExtensionContext) {
  window.showInformationMessage("ICP Dev Tools extension is now active!");

  workspace.onDidSaveTextDocument((document: TextDocument) => {
    if (document.languageId === "rust" && document.uri.scheme === "file") {
      window.showInformationMessage(`Rust file saved: ${document.fileName}`);

      const root = workspace.getWorkspaceFolder(document.uri);
      window.showInformationMessage(`Root: ${JSON.stringify(root)}`);

      const exists = window.terminals.find(
        (terminal) => terminal.name === terminalName
      );

      if (exists) {
        window.showInformationMessage(`Terminal exists: ${terminalName}`);
      } else {
        const terminal = window.createTerminal(terminalName);
      }
    }
  });

  const disposable = commands.registerCommand(
    "icp-dev-tools.generateCandid",
    () => {
      window.showInformationMessage(
        "Generating candid files for the current project."
      );
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}

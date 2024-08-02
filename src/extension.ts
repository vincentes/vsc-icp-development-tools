import {
  commands,
  ExtensionContext,
  TextDocument,
  window,
  workspace,
} from "vscode";

export function activate(context: ExtensionContext) {
  window.showInformationMessage("ICP Dev Tools extension is now active!");

  workspace.onDidSaveTextDocument((document: TextDocument) => {
    if (document.languageId === "rust" && document.uri.scheme === "file") {
      window.showInformationMessage(`Rust file saved: ${document.fileName}`);

      const root = workspace.getWorkspaceFolder(document.uri);
      window.showInformationMessage(`Root: ${JSON.stringify(root)}`);
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

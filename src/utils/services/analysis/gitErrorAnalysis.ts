
export interface GitErrorAnalysisResult {
  error: string;
  analysis: string;
  suggestedCommands: string[];
  confidence: number;
}

export const analyzeGitError = async (errorMessage: string): Promise<GitErrorAnalysisResult> => {
  if (errorMessage.includes("remote rejected") || errorMessage.includes("behind")) {
    return {
      error: errorMessage,
      analysis: "Your local branch is behind the remote branch. You need to pull the latest changes before pushing.",
      suggestedCommands: [
        "git pull origin main",
        "git pull --rebase origin main",
        "git fetch && git merge origin/main"
      ],
      confidence: 90
    };
  } else if (errorMessage.includes("conflict")) {
    return {
      error: errorMessage,
      analysis: "There are merge conflicts that need to be resolved.",
      suggestedCommands: [
        "git status",
        "git pull",
        "git mergetool"
      ],
      confidence: 85
    };
  }
  
  return {
    error: errorMessage,
    analysis: "This appears to be a generic Git error. Try checking your connection and repository status.",
    suggestedCommands: [
      "git status",
      "git remote -v",
      "git fetch"
    ],
    confidence: 60
  };
};

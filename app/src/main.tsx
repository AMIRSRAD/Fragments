import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

class NotebookBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return <main className="archive-cover book" role="alert">
        <h1>Fragments</h1>
        <p>The notebook could not be displayed. Reload to try again.</p>
        <button className="write-line" onClick={() => window.location.reload()}>Reload Fragments</button>
      </main>;
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <NotebookBoundary><App /></NotebookBoundary>
  </React.StrictMode>,
);

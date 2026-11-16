import { getCurrentWindow } from "@tauri-apps/api/window"
import { Copy, Feather, Info, LogOut, Minus, Square, X } from "lucide-react"
import { useEffect, useState } from "react"

export function TitleBar({openAbout,status,signOut,busy}: {openAbout:()=>void; status?:string; signOut?:()=>void; busy?:boolean}) {
  const window = getCurrentWindow()
  const [maximized, setMaximized] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    async function update() {
      const value = await window.isMaximized()
      if (active) setMaximized(value)
    }
    const check = () => { void update().catch(console.error) }
    const unsubscribe = window.onResized(check)
    void unsubscribe.catch(console.error)
    check()
    return () => {
      active = false
      void unsubscribe.then(remove => remove()).catch(console.error)
    }
  }, [window.label])

  async function control(action: "minimize" | "toggleMaximize" | "close", label: string) {
    setError("")
    try {
      await window[action]()
      if (action === "toggleMaximize") setMaximized(await window.isMaximized())
    } catch {
      setError(`Could not ${label.toLowerCase()}.`)
    }
  }

  const resizeLabel = maximized ? "Restore window" : "Maximize window"

  return <div className="title-bar">
    <div className="title-bar-drag" data-tauri-drag-region>
      <Feather size={15} aria-hidden="true"/>
      <span>Fragments</span>
      {status && <span className="title-bar-status" role="status">{status}</span>}
    </div>
    <div className="window-controls" role="group" aria-label="Window controls">
      <button type="button" title="About Fragments" aria-label="About Fragments" disabled={busy} onClick={openAbout}><Info size={15}/></button>
      {signOut && <button type="button" title="Sign out to notebook cover" aria-label="Sign out to notebook cover" disabled={busy} onClick={signOut}><LogOut size={16}/></button>}
      <button type="button" title="Minimize window" aria-label="Minimize window" onClick={() => void control("minimize", "Minimize window")}><Minus size={16} aria-hidden="true"/></button>
      <button type="button" title={resizeLabel} aria-label={resizeLabel} onClick={() => void control("toggleMaximize", resizeLabel)}>
        {maximized ? <Copy size={13} aria-hidden="true"/> : <Square size={13} aria-hidden="true"/>}
      </button>
      <button className="close-window" type="button" title="Close window" aria-label="Close window" onClick={() => void control("close", "Close window")}><X size={17} aria-hidden="true"/></button>
    </div>
    {error && <div className="window-control-error" role="alert">{error}</div>}
  </div>
}

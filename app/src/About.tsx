import { useEffect, useRef, useState } from "react"
import { invoke, isTauri } from "@tauri-apps/api/core"
import { X } from "lucide-react"
import { version } from "../package.json"

const repository = "https://github.com/AMIRSRAD/Fragments"
const setting = "fragments.auto-update-check"

function newer(tag: string) {
  const candidate = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(tag)
  if (!candidate) return false
  const current = version.split(".").map(Number)
  const parts = candidate.slice(1).map(Number)
  const difference = parts.findIndex((value,index)=>value !== current[index])
  return difference >= 0 && parts[difference] > current[difference]
}

export function About({open, close}: {open:boolean; close:()=>void}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [automatic,setAutomatic] = useState(()=>localStorage.getItem(setting) !== "off")
  const [message,setMessage] = useState("Check GitHub for a new version.")
  const [available,setAvailable] = useState(false)
  const [checking,setChecking] = useState(false)
  const [linkError,setLinkError] = useState("")
  const pending = useRef(false)

  async function check() {
    if (pending.current) return
    pending.current = true
    setChecking(true)
    try {
      const response = await fetch("https://api.github.com/repos/AMIRSRAD/Fragments/releases/latest", {
        signal:AbortSignal.timeout(10000),
      })
      if (response.status === 404) {
        setAvailable(false)
        setMessage("No releases have been published on GitHub yet.")
        return
      }
      if (!response.ok) throw Error()
      const release = await response.json()
      if (typeof release.tag_name !== "string") throw Error()
      const update = newer(release.tag_name)
      setAvailable(update)
      setMessage(update ? `Version ${release.tag_name.replace(/^v/,"")} is available.` : "You’re up to date.")
    } catch {
      setAvailable(false)
      setMessage("Couldn’t check for updates. Try again when connected.")
    } finally {
      pending.current = false
      setChecking(false)
    }
  }

  useEffect(()=>{
    if (!automatic) return
    void check()
    const timer = window.setInterval(()=>void check(), 6 * 60 * 60 * 1000)
    return ()=>window.clearInterval(timer)
  },[automatic])

  useEffect(()=>{
    const element = dialog.current
    if (!element) return
    if (open && !element.open) element.showModal()
    else if (!open && element.open) element.close()
  },[open])

  async function openLink(destination: string) {
    setLinkError("")
    try {
      if (isTauri()) await invoke("open_about_link",{destination})
      else window.open(destination === "website" ? "https://amirsrad.ir" : destination === "github" ? repository : repository+"/releases/latest","_blank","noopener,noreferrer")
    } catch {
      setLinkError("Couldn’t open your browser.")
    }
  }

  return <dialog ref={dialog} className="calendar-slip about-dialog" aria-labelledby="about-heading" onClose={close}
    onClick={event=>{if(event.target===event.currentTarget) close()}}>
    <section className="about-content">
      <div className="picker-heading"><h2 id="about-heading">About</h2><button className="icon-button" aria-label="Close About" onClick={close}><X size={19}/></button></div>
      <div className="about-brand"><img src="/fragments-icon.svg" alt="" width={68} height={68}/><h3>Fragments</h3><small>Version {version}</small><p>A private notebook for memories and people.</p></div>
      <h3>Updates</h3>
      <div className="about-row"><div><strong>Check for updates</strong><p role="status">{checking ? "Checking GitHub…" : message}</p></div>
        <button className="write-line" disabled={checking} onClick={()=>void check()}>Check now</button></div>
      {available && <div className="about-row"><span>Get the latest installer from GitHub.</span><button className="primary-action" onClick={()=>void openLink("release")}>View release</button></div>}
      <label className="about-row"><span><strong>Check automatically</strong><small>Check at startup and every six hours.</small></span><input type="checkbox" checked={automatic} onChange={event=>{
        setAutomatic(event.target.checked)
        localStorage.setItem(setting,event.target.checked ? "on" : "off")
      }}/></label>
      <h3>Made by AmirSRAD</h3>
      <div className="about-row"><span>Website<small>amirsrad.ir</small></span><button className="write-line" onClick={()=>void openLink("website")}>Open website</button></div>
      <div className="about-row"><span>GitHub<small>github.com/AMIRSRAD/Fragments</small></span><button className="write-line" onClick={()=>void openLink("github")}>Open GitHub</button></div>
      {linkError && <p role="alert">{linkError}</p>}
    </section>
  </dialog>
}

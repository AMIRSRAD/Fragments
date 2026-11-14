import { invoke } from "@tauri-apps/api/core"
import { attachments, mediaUrl, type Entry } from "./NotebookEntry"
import type { Timing } from "./dates"
import { storyText, type People } from "./memories"
import { participant } from "./MemoryNotes"

const escape = (value: string) => value.replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]!)

async function embeddedMedia(entry: Entry, item: ReturnType<typeof attachments>[number], persistent: boolean) {
  const blob = persistent && !["legacy-cover","sample-cover"].includes(item.id)
    ? new Blob([await invoke<ArrayBuffer>("read_album_media",{id:item.id,mime:item.mime})],{type:item.mime})
    : await fetch(mediaUrl(entry,item)).then(response => {
      if (!response.ok) throw Error("Attachment could not be read.")
      return response.blob()
    })
  return await new Promise<string>((resolve,reject)=>{
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

export async function exportAlbum(entries: Entry[], title: string, format: (date: string, timing?: Timing) => string, people: People, persistent: boolean) {
  const sections: string[] = []
  let missing = 0
  for (const entry of entries) {
    const media: string[] = []
    for (const item of attachments(entry)) {
      try {
        if (!/^(image\/(jpeg|png|webp|gif)|video\/(mp4|webm|quicktime))$/.test(item.mime)) throw Error("Unsupported attachment.")
        const url = escape(await embeddedMedia(entry,item,persistent))
        media.push(`<figure>${item.mime.startsWith("video/") ? `<video controls preload="none" src="${url}"></video>` : `<img loading="lazy" alt="${escape(item.caption)}" src="${url}">`}<figcaption dir="auto">${escape(item.caption)}</figcaption></figure>`)
      } catch {
        missing++
        media.push(`<p dir="auto">Attachment unavailable · ${escape(item.caption)}</p>`)
      }
    }
    const participants = Object.keys(people).filter(id=>participant(entry,id,people)).map(id=>escape(people[id].name))
    const subjects = (entry.about ?? []).filter(link=>!link.phaseOnly).flatMap(link=>{
      const person = people[link.personId]
      if (!person) return []
      const phase = person.phases?.find(item=>item.id===link.phaseId)
      return [escape(phase ? `${person.name} (${phase.name})` : person.name)]
    })
    sections.push(`<article><small>${escape(format(entry.date,entry.timing))} · <bdi>${escape(entry.chapter)}</bdi></small>
<h2 dir="auto">${escape(entry.title || "Untitled memory")}</h2>
${media.join("")}<p class="story" dir="auto">${escape(storyText(entry.text))}</p>
${subjects.length ? `<p>About · ${subjects.map(name=>`<bdi>${name}</bdi>`).join(", ")}</p>` : ""}
${participants.length ? `<p>People who were there · ${participants.map(name=>`<bdi>${name}</bdi>`).join(", ")}</p>` : ""}
${(entry.reflections ?? []).map(note=>`<section><h3>Reflection · ${escape(format(note.date))}</h3><p class="story" dir="auto">${escape(storyText(note.text))}</p></section>`).join("")}</article>`)
  }
  const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; media-src data:">
<title>${escape(title)}</title><style>body{background:#f8efe1;color:#332820;font:17px/1.65 system-ui;margin:24px auto;padding:0 20px;max-width:760px}h1,h2,h3{font-family:Georgia,serif;line-height:1.25}article{padding:24px 0;border-top:1px solid #dbcbb7}figure{margin:12px 0;background:#fffaf0;padding:8px}img,video{display:block;max-width:100%;margin:auto}figcaption{text-align:center}.story{white-space:pre-wrap;overflow-wrap:anywhere}</style>
<main><h1 dir="auto">${escape(title)}</h1>${sections.join("")}</main></html>`
  if (persistent) return {saved:await invoke<boolean>("save_readable_album",{html}),missing}
  const url = URL.createObjectURL(new Blob([html],{type:"text/html;charset=utf-8"}))
  const link = document.createElement("a")
  link.href = url
  link.download = "fragments-album.html"
  link.click()
  window.setTimeout(()=>URL.revokeObjectURL(url),1000)
  return {saved:true,missing}
}

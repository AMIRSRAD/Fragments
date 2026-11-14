export type Memory = { id: string; title: string; date: string; chapter: string; people: string[]; text: string; photo?: boolean }

export const storyPeople = {
  sara: { name: "Sara", note: "A university friend who joined the trip to the coast." },
  ali: { name: "Ali", note: "A friend from the years by the sea and the first apartment." },
  mina: { name: "Mina", note: "Part of the memories of moving into the first apartment." },
  omid: { name: "Omid", note: "A friend from university." },
  neda: { name: "Neda", note: "A friend from the university years." },
  leila: { name: "Leila", note: "A familiar face in the childhood memories." },
}
export type PersonId = string
export type People = Record<PersonId, { name: string; note: string }>
export const mentionPattern = /\[((?:[^\]\n\\]|\\[\]\\]|\\(?![\]\\]))+)\]\(fragments:person\/([a-z0-9-]+)\)/g
export const mentionLabel = (value: string) => value.replace(/\\([\]\\])/g, "$1")
export const storyText = (value: string) => value.replace(mentionPattern, (_, label: string) => mentionLabel(label))
export const mentions = (value: string, person: PersonId) =>
  Array.from(value.matchAll(mentionPattern)).some(match => match[2] === person)
export const searchKey = (value: string) => value.normalize("NFC").toLocaleLowerCase()
  .replaceAll("ي","ی").replaceAll("ك","ک").replaceAll("\u200c"," ")

const entries: Omit<Memory, "id">[] = [
  { title: "The afternoon we stayed", date: "2024-08-18", chapter: "By the sea", people: ["Sara", "Ali"], text: "[Sara](fragments:person/sara) wanted to stay until the light changed. We walked until the water took our footprints. I thought of [Mina](fragments:person/mina), who would have loved the quiet.", photo: true },
  { title: "Tea before the road", date: "2024-08-17", chapter: "By the sea", people: ["Sara"], text: "چای را کنار پنجره نوشیدیم. هوا هنوز خنک بود و جاده آرام." },
  { title: "A pocket full of shells", date: "2024-08-19", chapter: "By the sea", people: ["Ali"], text: "I brought three shells home. One still sits beside the lamp." },
  { title: "The first box", date: "2022-03-24", chapter: "A place of our own", people: ["Mina"], text: "We opened the box with the kettle first. The apartment smelled like fresh paint." },
  { title: "Rain on the balcony", date: "2022-04-02", chapter: "A place of our own", people: [], text: "I watched the street get dark, one puddle at a time." },
  { title: "Dinner on the floor", date: "2022-04-06", chapter: "A place of our own", people: ["Mina", "Ali"], text: "No table yet. We sat on newspaper and ate noodles." },
  { title: "The borrowed book", date: "2018-10-14", chapter: "University days", people: ["Sara"], text: "[Sara](fragments:person/sara) lent me the book. There was a bus ticket inside, folded to mark the last page." },
  { title: "A bench in October", date: "2018-10-22", chapter: "University days", people: ["Omid"], text: "We waited for the lecture hall to open and watched the leaves collect around our shoes." },
  { title: "After the last exam", date: "2019-06-21", chapter: "University days", people: ["Omid", "Neda"], text: "Nobody wanted to talk about the exam. We ordered another round of tea." },
  { title: "A letter on the train", date: "2019-09-06", chapter: "University days", people: ["Neda"], text: "I wrote it in pencil. The train made my handwriting look like someone else's." },
  { title: "The kitchen clock", date: "2008-07-12", chapter: "Earlier years", people: ["Leila"], text: "The clock stopped during lunch. We didn't notice until evening." },
  { title: "Under the mulberry tree", date: "2008-06-09", chapter: "Earlier years", people: ["Leila"], text: "Our hands went purple. We tried to wash them before going inside." },
  { title: "A Sunday walk", date: "2024-09-01", chapter: "By the sea", people: [], text: "The city sounded different after a week away." },
  { title: "Two cups", date: "2023-01-12", chapter: "A place of our own", people: ["Mina"], text: "The blue cup cracked, so we planted mint in it." },
  { title: "A light in the hall", date: "2023-02-03", chapter: "A place of our own", people: [], text: "The small lamp finally arrived. I left it on all night." },
  { title: "The old bus stop", date: "2019-10-05", chapter: "University days", people: ["Neda"], text: "They had painted it green since we were last there." },
  { title: "A day's worth of snow", date: "2009-01-16", chapter: "Earlier years", people: ["Leila"], text: "By evening the footprints had disappeared." },
  { title: "A postcard without a date", date: "", chapter: "Earlier years", people: [], text: "A blue house, a red roof. I don't remember who sent it." },
]

export const sampleMemories: Memory[] = entries.map((entry, index) => ({ ...entry, id: `sample-${index}` }))
export const chapters = [...new Set(entries.map(entry => entry.chapter))]
export const people = [...new Set(entries.flatMap(entry => entry.people))].sort()

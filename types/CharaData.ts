export type CharaData = {
  name: string
  charaKey: string
  images: string[]
  voiceBase: { language: string; base: string }[]
  voiceList: {
    title: string
    filename: string
    text: { language: string; content: string }[]
  }[]
}

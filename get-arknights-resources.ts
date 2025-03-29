import * as fs from 'fs'
import ora from 'ora'
import puppeteer from 'puppeteer'
import { CharaData } from './types/CharaData'

const result = [] as { name: string; charaKey: string }[]
const charaDatas = [] as CharaData[]

const start = async (oldCharactersName: string[], threads: number) => {
    const spinner = ora('正在启动Puppeteer……').start()
    const browser = await puppeteer.launch({headless: true})
    spinner.succeed('Puppeteer启动成功')
    spinner.start('正在获取干员列表……')
    const page = await browser.newPage()
    await page.setViewport({width: 1080, height: 1024})
    await page.goto('https://prts.wiki/w/%E5%B9%B2%E5%91%98%E4%B8%80%E8%A7%88')
    await page.waitForSelector('#filter-result > div:nth-child(50)')
    await page.select('#pagination > div.paginations-container > select', '200')
    await page.waitForSelector('#filter-result > div:nth-child(200)')
    const charactersName = [] as string[]

    //把两页的干员名字都获取到
    for (let i = 0; i < 2; i++) {
        const onePage = await page.$$eval('#filter-result > div', (el) => {
            return el.map((item) => {
                return item.querySelector('div.name > div > a > div')?.innerHTML as string
            })
        })
        charactersName.push(...onePage)

        if (i === 0) {
            await page.click(
                '#pagination > div.paginations-container > div.checkbox-container > div:nth-child(2)',
            )
        }
    }

    spinner.succeed(`干员列表获取成功,共获取到${charactersName.length}个干员`)

    //增量更新
    const newCharacters = charactersName.filter((item) => !oldCharactersName.includes(item))

    spinner.succeed(`共有${newCharacters.length}个新干员`)
    const chunk = (arr: string[], size: number) => {
        const result = [] as string[][]
        for (let i = 0; i < arr.length; i += size) {
            result.push(arr.slice(i, i + size))
        }
        return result
    }

    //并发
    const chunks = chunk(newCharacters, Math.ceil(newCharacters.length / threads))
    await Promise.all(
        chunks.map(async (items, workerIndex) => {
            const workerSpinner = ora(`正在启动${workerIndex + 1}# Worker……`).start()
            //每个并发都新建一个Page
            const workerPage = await browser.newPage()
            await workerPage.setViewport({width: 1080, height: 1024})
            workerSpinner.succeed(`启动${workerIndex + 1}# Worker成功`)
            //这一层是每个Page要处理的内容
            let index = 0
            for (const item of items) {
                index++
                //获取干员立绘
                workerSpinner.color = 'yellow'
                workerSpinner.start(
                    `${workerIndex + 1}# Worker正在获取${item}的立绘…… ${index}/${items.length}`,
                )
                await workerPage.goto(`https://prts.wiki/w/${item}`)
                await workerPage.waitForSelector('#charimg')

                let retry = 0
                do {
                    try {
                        await workerPage.mouse.wheel({deltaY: 1000})
                        await workerPage.waitForSelector('#charimg > img:nth-child(1)', {timeout: 10 * 1e3})
                    } catch (e) {
                        await workerPage.reload()
                        retry++
                    }
                } while (!(await workerPage.$('#charimg > img:nth-child(1)')) && retry < 3)
                if (retry === 3) {
                    workerSpinner.fail(`${workerIndex + 1}# Worker获取${item}的立绘失败`)
                }
                const charaImgs = await workerPage.$$eval('#charimg > img', (el) => {
                    return el.map((item) => {
                        return `https:${item.getAttribute('src')}`
                    })
                })
                workerSpinner.succeed(
                    `${workerIndex + 1}# Worker获取${item}的立绘成功 ${index}/${items.length}`,
                )
                workerSpinner.color = 'green'
                //获取干员语音
                workerSpinner.color = 'yellow'
                workerSpinner.start(
                    `${workerIndex + 1}# Worker正在获取${item}的语音…… ${index}/${items.length}`,
                )
                const voiceBase =
                    await workerPage.$eval('#voice-data-root',
                        (el) => {
                            return el.getAttribute('data-voice-base')
                                .split(',')
                                .map((item) => {
                                    return ({
                                        language: item.split(':')[0],
                                        base: item.split(':')[1],
                                    })
                                })

                        })
                const voiceData = await workerPage.$$eval('#voice-data-root > div', (el) => {
                    return el.map((item) => {
                        return {
                            title: item.getAttribute('data-title'),
                            filename: item.getAttribute('data-voice-filename'),
                            text: Array.from(item.querySelectorAll('div')).map((item) => {
                                return {
                                    language: item.getAttribute('data-kind-name'),
                                    content: item.innerHTML,
                                }
                            }),
                        }
                    })
                })

                const charaKey = await workerPage.$eval('#voice-data-root', (el) =>
                    el.getAttribute('data-voice-key') as string,
                )

                const charaData = {
                    name: item,
                    charaKey,
                    images: charaImgs,
                    voiceBase,
                    voiceList: voiceData,
                } as CharaData

                result.push({name: item, charaKey})
                charaDatas.push(charaData)

                workerSpinner.succeed(
                    `${workerIndex + 1}# Worker获取${item}的语音成功 ${index}/${items.length}`,
                )
                workerSpinner.color = 'green'

                spinner.succeed(`总进度:${result.length}/${newCharacters.length}`)
            }
            workerSpinner.succeed(`${workerIndex + 1}# Worker任务完成`)
            await workerPage.close()
        }),
    )
    spinner.succeed('所有任务完成')
    //关闭浏览器
    await browser.close()
}

const oldCharactersName = [] as string[]
//TODO: 读取旧数据来增量更新

const stopwatch = performance.now()
start(oldCharactersName, 4)
    .then(async () => {
        if (!fs.existsSync('./data/arknights')) fs.mkdirSync('./data/arknights', {recursive: true})
        await Promise.all(
            charaDatas.map(async (charaData) => {
                await fs.promises.writeFile(
                    `./data/arknights/${charaData.charaKey}.json`,
                    JSON.stringify(charaData, null, 2),
                )
            }),
        )
    })
    .then(async () => {
        await fs.promises.writeFile(
            './data/arknightsCharacterList.json',
            JSON.stringify(result, null, 2),
        )
    })
    .then(() => {
        console.log('done')
        console.log(`耗时：${(performance.now() - stopwatch) / 1000}秒`)
    })

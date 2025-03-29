// Description: 更新内置头像
import axios from 'axios'
import * as fs from 'fs'
import puppeteer, { type Page } from 'puppeteer'
import { RoleListResponse, RoleResponse } from './types.js'

const avatars = {}

const stopwatch = performance.now()
avatar().then(() => {
    console.log(avatars)
    console.log(`耗时：${(performance.now() - stopwatch) / 1000}秒`)
    if (!fs.existsSync('./data')) fs.mkdirSync('./out')
    fs.writeFileSync('./data/avatars.json', JSON.stringify(avatars, null, 2))
})

async function avatar() {
    const browser = await puppeteer.launch({headless: true})
    await Promise.all([
        updateGenshin(await browser.newPage(), {
            webUrl: 'https://wiki.biligame.com/ys/%E8%A7%92%E8%89%B2',
            genderWebUrl: 'https://wiki.biligame.com/ys/%E8%A7%92%E8%89%B2%E7%AD%9B%E9%80%89',
            blackList: [],
        }),
        updateArknights(await browser.newPage(), {
            webUrl: 'https://prts.wiki/w/%E5%B9%B2%E5%91%98%E4%B8%80%E8%A7%88',
            blackList: [],
        }),
        updateBlueArchive({blackList: []}),
        updateStarRail(await browser.newPage(), {
            webUrl: 'https://wiki.biligame.com/sr/%E8%A7%92%E8%89%B2%E7%AD%9B%E9%80%89',
            blackList: [],
        }),
        updateUmamusume(await browser.newPage(), {
            webUrl: 'https://wiki.biligame.com/umamusume/%E8%B5%9B%E9%A9%AC%E5%A8%98%E4%B8%80%E8%A7%88',
            blackList: [],
        }),
        updateWutheringwaves({blackList:[]})
    ]).then(() => {
        browser.close()
    })
}

const updateGenshin = async (
    page: Page,
    config: { webUrl: string; genderWebUrl: string; blackList: string[] },
) => {
    await page.setViewport({width: 1080, height: 1024})
    console.log(config.webUrl)
    await page.goto(config.webUrl)
    await page.waitForSelector('#CardSelectTr > div:nth-child(83)')

    const traveler = [
        {
            description: '空',
            url: 'https://i0.hdslb.com/bfs/article/921ef6095df5ab142613cd27b2a7f52c861badb1.jpg@1256w_1256h_!web-article-pic.avif',
        },
        {
            description: '荧',
            url: 'https://i0.hdslb.com/bfs/article/4c46a8c0a2c52f91568bfd03ba25451bcf2a230a.jpg@1256w_1256h_!web-article-pic.avif',
        },
    ]

    const result = (
        await page.$$eval('#CardSelectTr > div', (el) => {
            return el.map((item) => {
                return {
                    description: item.querySelector('div.L')?.innerHTML as string,
                    // url: `https:${item.querySelector('img').getAttribute('data-url').split('@')[0]}`
                    url: item.querySelector('a.image > img')?.getAttribute('src') as string,  //小图片，节省带宽
                }
            })
        })
    )
        .filter((item) => !config.blackList.includes(item.description))
        .concat(...traveler)

    await page.goto(config.genderWebUrl)
    await page.waitForSelector('#CardSelectTr > tbody > tr:nth-child(82)')

    const genderResult = (
        await page.$$eval('#CardSelectTr > tbody > tr', (el) => {
            return el.map((item) => {
                return {
                    description: item.querySelector('td:nth-child(1) > a')?.getAttribute('title'),
                    gender: item.querySelector('td:nth-child(6)')?.innerHTML.trim(),
                }
            })
        })
    ).concat(
        ...[
            {description: '空', gender: '男'},
            {description: '荧', gender: '女'},
        ],
    )

    console.log(result)

    const genderMap = new Map(genderResult.map((item) => [item.description, item.gender]))
    console.log(genderMap)
    const male = [] as { description: string; url: string }[]
    const female = [] as { description: string; url: string }[]
    result.forEach((item) => {
        switch (genderMap.get(item.description)) {
            case '男':
                male.push(item)
                break
            case '女':
                female.push(item)
                break
            default:
                break
        }
    })
    console.log(male, female)
    if (male.length === 0 || female.length === 0) {
        throw new Error('原神头像获取失败')
    }
    // @ts-ignore
    avatars['genshin'] = {male, female}
    await page.close()
}

const updateArknights = async (page: Page, config: { webUrl: string; blackList: string[] }) => {
    await page.setViewport({width: 1080, height: 1024})
    console.log(config.webUrl)
    await page.goto(config.webUrl)
    await page.waitForSelector('#filter-result > div:nth-child(50)')
    await page.select('#pagination > div.paginations-container > select', '200')
    await page.waitForSelector('#filter-result > div:nth-child(200)')
    const male: { description: string; url: string | null }[] = []
    const female: { description: string; url: string | null }[] = []
    for (let i = 0; i < 2; i++) {
        const result = (
            await page.$$eval('#filter-result > div', (el) => {
                return el.map((item) => {
                    return {
                        name: item.querySelector('div.name > div > a > div')?.innerHTML as string,
                        url: item.querySelector('div.avatar > div > a > img')?.getAttribute('data-src') as string,
                        gender: item.querySelector('div.other > div.sex')?.innerHTML as string,
                    }
                })
            })
        ).filter((item) => !config.blackList.includes(item.name))

        result.forEach((item) => {
            switch (item.gender) {
                case '男':
                    male.push({description: item.name, url: item.url})
                    break
                case '女':
                    female.push({description: item.name, url: item.url})
                    break
                default:
                    break
            }
        })
        if (i === 0) {
            await page.click(
                '#pagination > div.paginations-container > div.checkbox-container > div:nth-child(2)',
            )
        }
    }
    console.log(male, female)
    if (male.length === 0 || female.length === 0) {
        throw new Error('明日方舟头像获取失败')
    }
    // @ts-ignore
    avatars['arknights'] = {male, female}
    await page.close()
}

const updateBlueArchive = async (config: { blackList: string[] }) => {
    await axios
        .get('https://api.kivo.fun/api/v1/data/students/?page=1&page_size=500&is_npc=false')
        .then((res) => {
            const female = res.data.data.students
                .map((item: { family_name: any; given_name: any; skin: string | any[]; avatar: any }) => {
                    const description = `${item.family_name}${item.given_name}${
                        item.skin.length > 0 ? `(${item.skin})` : ''
                    }`
                    return {description, url: decodeURI(`https:${item.avatar}`)}
                })
                .filter((item: { description: string }) => !config.blackList.includes(item.description))
            if (female.length === 0) {
                throw new Error('蔚蓝档案头像获取失败')
            }
            // @ts-ignore
            avatars['blueArchive'] = {male: [], female}
        })
}

const updateStarRail = async (page: Page, config: { webUrl: string; blackList: string[] }) => {
    await page.setViewport({width: 1080, height: 1024})
    console.log(config.webUrl)
    await page.goto(config.webUrl)
    await page.waitForSelector('#CardSelectTr > tbody > tr:nth-child(45)')

    const result = await page.$$eval('#CardSelectTr > tbody > tr', (el) => {
        return el.map((item) => {
            return {
                description: item.querySelector('td:nth-child(2) > a')?.innerHTML as string,
                url: decodeURI(item.querySelector('td:nth-child(1) > div:nth-child(1) > a > img')?.getAttribute('src') as string),
                gender: item.querySelector('td:nth-child(6)')?.innerHTML.trim() as string,
            }
        })
    })

    const index = result.findIndex((item) => item.description === '托帕&amp;账账')
    result[index].url =
        'https://patchwiki.biligame.com/images/sr/thumb/c/c4/06fupomr900c72ymsn6pgq8m4c077r7.png/60px-托帕&账账.png'

    const male: { description: string; url: string }[] = []
    const female: { description: string; url: string }[] = []
    result.forEach((item) => {
        switch (item.gender) {
            case '男':
                male.push({description: item.description, url: item.url})
                break
            case '女':
                female.push({description: item.description, url: item.url})
                break
            default:
                break
        }
    })
    console.log(male, female)
    // @ts-ignore
    avatars['starRail'] = {male, female}
    await page.close()
}

const updateUmamusume = async (page: Page, config: { webUrl: string; blackList: string[] }) => {
    await page.setViewport({width: 1080, height: 1024})
    console.log(config.webUrl)
    await page.goto(config.webUrl)
    await page.waitForSelector(
        '#mw-content-text > div > div.main-line-wrap > div > div > div:nth-child(1) > span:nth-child(132)',
    )
    const female = await page.$$eval(
        '#mw-content-text > div > div.main-line-wrap > div > div > div:nth-child(1) > span',
        (el) => {
            return el.map((item) => {
                return {
                    description: item.querySelector('span > div > center > a')?.innerHTML as string,
                    url: item.querySelector('span > div > a > img')?.getAttribute('src') as string,
                }
            })
        },
    )
    // @ts-ignore
    avatars['umamusume'] = {male: [], female}
    await page.close()
}

const updateWutheringwaves = async (config: { blackList: string[] }) => {
    // await page.setViewport({width: 1080, height: 1024})
    // console.log(config.webUrl)
    // await page.goto(config.webUrl)
    // await page.waitForSelector('#__nuxt > div > div > main > div > div > div > div.filtered-items.mt-4.grid.grid-cols-2.xl\\:grid-cols-6.gap-4 > a:nth-child(35)')
    //
    // const characterList= (await page.$$eval('#__nuxt > div > div > main > div > div > div > div.filtered-items.mt-4.grid.grid-cols-2.xl\\:grid-cols-6.gap-4 > a', (el) => {
    //     return el.map(item => {
    //         return {
    //             url: item.querySelector('img:nth-child(3)')?.getAttribute('src') as string,
    //             description: item.querySelector('div.grow.flex.justify-center.items-center.p-2 > div')?.innerHTML as string,
    //             link: `https://ww.kuro.wiki${item.href}`,
    //         }
    //     })
    // }))
    //
    // const chunks = chunk(characterList, 50)


    let resp = await axios.get('https://static-cloudflare-ww.kuro.wiki/wiki.config.json')

    const resVer = resp.data.resVer as string

    const storageURL = resp.data.storageURL as string

    resp = await axios.get(`${storageURL}data/${resVer}/zh-Hans/codex/roles/list.json`)

    const characterIdList =
        (resp.data as RoleListResponse)
            .data
            .map(item => item.id,
            )
    const male = []
    const female = []

    for (const id of characterIdList) {
        resp = await axios.get(`${storageURL}data/${resVer}/zh-Hans/codex/roles/${id}.json`)
        const characterData = resp.data as RoleResponse
        if(characterData.data.person.sex === '男') {
            male.push({
                description: characterData.data.title,
                url: `${storageURL}kuro/Client/Content/Aki/UI/UIResources/${characterData.data.icon}`,
            })
        } else {
            female.push({
                description: characterData.data.title,
                url: `${storageURL}kuro/Client/Content/Aki/UI/UIResources/${characterData.data.icon}`
            })
        }
    }

    // @ts-ignore
    avatars['wutheringwaves'] = {male,female}
}

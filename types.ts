export type RoleResponse = {
    btime: number
    data: {
        id: number
        title: string
        desc: string
        weapon: number
        element: number
        rarity: number
        card: string
        icon: string
        tags: Array<{
            id: number
            title: string
            desc: string
            icon: string
            color: string
        }>
        props: {
            hp: number
            atk: number
            def: number
        }
        commonConsume: {
            levelBreach: Array<
                Array<{
                    id: string
                    title: string
                    rarity: number
                    icon: string
                    value: number
                }>
            >
            skill: Array<
                Array<{
                    id: string
                    title: string
                    rarity: number
                    icon: string
                    value: number
                }>
            >
            resonantChain: {
                id: number
                title: string
                rarity: number
                icon: string
            }
            level: number
        }
        skills: Array<{
            id: number
            title: string
            desc: string
            type: number
            detail?: Array<{
                id: number
                title: string
                growth: Array<string>
            }>
            icon: string
            consume?: Array<{
                id: string
                title: string
                rarity: number
                icon: string
                value: number
            }>
            nodeIndex?: number
        }>
        resonantChain: Array<{
            id: number
            title: string
            desc: string
            icon: string
        }>
        person: {
            birthday: string
            sex: string
            country: string
            influence: string
            telnet: {
                title: string
                doc: string
                certification: string
            }
            cvCN: string
            cvJP: string
            cvKO: string
            cvEN: string
            stories: Array<{
                id: number
                title: string
                content: string
                cond: string
            }>
            voices: Array<
                Array<{
                    id: number
                    title: string
                    content: string
                    file: string
                    cond?: string
                }>
            >
            specialCook: {
                id: number
                title: string
                rarity: number
                icon: string
            }
            favorGoods: Array<{
                id: number
                title: string
                desc: string
                icon: string
                cond?: string
            }>
        }
        skins: Array<{
            id: number
            title: string
            rarity: number
            subTitle: string
            desc: string
            portrait: string
        }>
        defaultSkin: number
        guides: Array<{
            id: number
            url: string
            name: string
        }>
        guides2: {
            skillFlow: Array<{
                id: number
                type: number
                typeTitle: string
                title: string
                icon: string
                order: number
            }>
            weaponValue: Array<{
                id: number
                title: string
                rarity: number
                icon: string
                value: string
                breach?: number
            }>
            resonantChainREC: Array<{
                id: number
                title: string
                icon: string
                value: string
            }>
            partners: Array<{
                p2: Array<{
                    id: number
                    title: string
                    rarity: number
                    icon: string
                }>
                p3: Array<{
                    id: number
                    title: string
                    rarity: number
                    icon: string
                }>
            }>
            phantoms: {
                plans: Array<{
                    type: number
                    fetter: {
                        id: number
                        title: string
                        icon: string
                    }
                    c4: Array<{
                        id: number
                        title: string
                        rarity: number
                        icon: string
                    }>
                }>
                mp: {
                    c4: string
                    c3: string
                    c1: string
                }
                sp: string
            }
            link: string
            updateTime: number
        }
    }
}

export type RoleListResponse = {
    btime: number
    elements: Array<{
        id: number
        title: string
        icon: string
        color: string
    }>
    weaponTypes: Array<{
        id: number
        title: string
    }>
    data: Array<{
        id: number
        title: string
        weapon: number
        element: number
        rarity: number
        tags: Array<number>
        icon: string
    }>
}


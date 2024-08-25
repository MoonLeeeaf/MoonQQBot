/**
 * MoonBot
 * Author - GitHub @MoonLeeeaf
 * License - Apache 2.0
 */

const { CqApi, ModTypes, PostTypes } = require('cqhttp-ts')
const DataBase = require('./db')

const { unescapeHTMLEntities, getAt, getReplyMessageId, checkAdmin, configDB, config, makeSingleForwardMessage, findNonNull, textMsg } = require('./utils')

// ======== 功能配置处 ========

    const configList = [
        [
            /^早安$/,
            /** @param { PostTypes.GroupMessageType } msg */
            async (argv, msg) => {
                if (!config.晚安列表) config.晚安列表 = {}

                let success = [
                    `早上好，${msg.sender.nickname}喵~ 你一共睡了${(Date.now() - config.晚安列表[msg.sender.user_id]) / 60 / 60}小时 祝你今天也有个愉快的心情哦喵~`,
                ]
                let failed_time_early = [
                    '早上...早上个屁啊! 你看看几点了都!',
                    `${msg.sender.nickname}! 你是不是熬夜了!`,
                    '昨晚...是不是太嗨了...',
                    `${msg.sender.nickname}! 别又熬穿了!`,
                    '睡不着吗? 要不我陪你睡吧~'
                ]
                let failed_time_later = [
                    '干脆睡到下午得了! 笨蛋!',
                    '哇哦... 现在几点了你才起床...',
                    '你是打算中午饭和晚饭一起吃吗~ 那我们一起吃饭吧!',
                    `我说你啊 ${msg.sender.nickname}, 怕不是在过着 UTC+4 的生活!`,
                ]
                let failed_time_very_later = [
                    '干脆睡到下午得了! 笨蛋!',
                    '哇哦... 现在几点了你才起床...',
                    '你是打算中午饭和晚饭一起吃吗~ 那我们一起吃饭吧!',
                    `我说你啊 ${msg.sender.nickname}, 怕不是在过着 UTC+4 的生活!`,
                ]

                let useList
                if (new Date().getHours() >= 5 && new Date().getHours() <= 18)
                    if (new Date().getHours() <= 10) {
                        useList = success
                        delete config.晚安列表[msg.sender.user_id]
                    } else if (new Date().getHours() <= 12)
                        useList = failed_time_later
                    else
                        useList = failed_time_very_later
                else
                    useList = failed_time_early
                    
                configDB.update(config)

                CqApi.sendGroupMessageApi({
                    group_id: msg.group_id,
                    message: useList[Math.floor(Math.random() * useList.length)],
                })
            }
        ],
        [
            /^晚安$/,
            /** @param { PostTypes.GroupMessageType } msg */
            async (argv, msg) => {
                if (!config.晚安计数 || (new Date(config.晚安_最后时间).getDate() != new Date().getDate())) config.晚安计数 = 0
                if (!config.晚安列表) config.晚安列表 = {}

                let time_ok = new Date().getHours() <= 6 || new Date().getHours() >= 20

                let slept = config.晚安列表[msg.sender.user_id] != null

                if (!slept)
                    if (time_ok) config.晚安计数++
                    else { }
                else if (new Date(config.晚安列表[msg.sender.user_id]).getDate() != new Date().getDate())
                    config.晚安列表[msg.sender.user_id] = null

                let success = [
                    `晚安${msg.sender.nickname}, 你是第${config.晚安计数}个睡觉的~`,
                ]
                let failed_slept = [
                    '你不是睡过了嘛! 哼!',
                ]
                let failed_time = [
                    '这么早睡觉? 再陪我玩会嘛...',
                    '要睡你去睡! 别拉着我!',
                ]

                let useList = (time_ok ? (slept ? failed_slept : success) : failed_time)

                if (time_ok && !slept) config.晚安列表[msg.sender.user_id] = Date.now()

                config.晚安_最后时间 = Date.now()

                configDB.update(config)

                CqApi.sendGroupMessageApi({
                    group_id: msg.group_id,
                    message: useList[Math.floor(Math.random() * useList.length)],
                })
            }
        ],
        [
            /^\[CQ:markdown,.*/,
            /** @param { PostTypes.GroupMessageType } msg */
            async (argv, msg) => {
                if (!config.反qmd) config.反qmd = {}

                if (!config.反qmd[msg.group_id]) return

                CqApi.sendGroupMessageApi({
                    group_id: msg.group_id,
                    message: makeSingleForwardMessage('💮本条 Markdown 消息的源代码💮\n' + decodeURIComponent(unescapeHTMLEntities(msg.raw_message)) + '\n\n💮此 Markdown 消息发送者: ' + `${msg.sender.nickname}(${msg.sender.user_id})💮`)
                })
            }
        ],
        [
            /^\[CQ:json,data=(.*)\]$/,
            /** @param { PostTypes.GroupMessageType } msg */
            async (argv, msg) => {
                if (!config.反json) config.反json = {}

                if (!config.反json[msg.group_id]) return

                let meta = JSON.parse(msg.message[0].data.data).meta

                CqApi.sendGroupMessageApi({
                    group_id: msg.group_id,
                    message: [
                        {
                            type: "node",
                            data: {
                                name: '满月',
                                uin: '114514',
                                content: '↓以下是该 JSON 卡片的一些信息'
                            }
                        },
                        {
                            type: "node",
                            data: {
                                name: '满月',
                                uin: '114514',
                                content: '卡片点击跳转链接: ' + findNonNull([meta.news, meta.miniapp, meta.eventshare]).jumpUrl
                            }
                        },
                        {
                            type: "node",
                            data: {
                                name: '满月',
                                uin: '114514',
                                content: textMsg('QJSON源代码: ' + JSON.stringify(JSON.parse(msg.message[0].data.data)) + '\n\n💮此 JSON卡片 发送者: ' + `${msg.sender.nickname}(${msg.sender.user_id})💮`),
                            }
                        },
                    ]
                })
            }
        ],
    ]

// ======== 功能配置处 ========

module.exports = configList

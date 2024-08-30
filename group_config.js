/**
 * MoonBot
 * Author - GitHub @MoonLeeeaf
 * License - Apache 2.0
 */

const { CqApi, ModTypes, PostTypes } = require('cqhttp-ts')
const DataBase = require('./db')

const { unescapeHTMLEntities, getAtOrThrow, getReplyMessageId, checkAdmin, configDB, config, makeSingleForwardMessage, findNonNull, textMsg, cleanUrl } = require('./utils')

// ======== 功能配置处 ========

const configList = [
    [
        /^\[CQ:markdown,.*/,
        null,
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            if (!config.反qmd) config.反qmd = {}

            if (!config.反qmd[msg.group_id]) return

            CqApi.sendGroupMessageApi({
                group_id: msg.group_id,
                message: [
                    {
                        type: "node",
                        data: {
                            name: '满月',
                            uin: '114514',
                            content: '💮去你妈的 QMarkdown 卡片消息💮'
                        }
                    },
                    {
                        type: "node",
                        data: {
                            name: '满月',
                            uin: '114514',
                            content: textMsg('💮QMD源代码💮\n' + decodeURIComponent(unescapeHTMLEntities(msg.raw_message)) + '\n\n💮此 Markdown卡片 发送者: ' + `${msg.sender.nickname}(${msg.sender.user_id})💮`),
                        }
                    },
                ]
            })
        }
    ],
    [
        /^\[CQ:json,data=.*/,
        null,
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            if (!config.反json) config.反json = {}

            if (!config.反json[msg.group_id]) return

            let card = JSON.parse(msg.message[0].data.data)

            // 防止因为自己发的消息刷屏
            if (card.app.indexOf('multimsg') != -1 && msg.sender.user_id == msg.self_id) return

            let meta = card.meta

            let inner_meta = findNonNull([
                meta.news, // 未知(《新闻》)
                meta.miniapp, // “小”程序
                meta.eventshare, // 未知
                meta.video, // 短视频(byd这什么jb)
                meta.detail, // “小”程序
                meta.detail_1, // “小”程序(目前只看到B站的分享卡片是这样的)
                meta.contact, // 推荐群聊 推荐好友
                meta.music, // 阴乐
                meta.pic, // 图片卡片
            ], { jumpUrl: '无法获取卡片点击链接' }) // 玩nm 不支持的卡片类型 阿弥诺斯

            CqApi.sendGroupMessageApi({
                group_id: msg.group_id,
                message: [
                    {
                        type: "node",
                        data: {
                            name: '满月',
                            uin: '114514',
                            content: '💮去你妈的 JSON 卡片消息💮'
                        }
                    },
                    {
                        type: "node",
                        data: {
                            name: '满月',
                            uin: '114514',
                            content: await cleanUrl(findNonNull([
                                inner_meta.pcJumpUrl, // 短视频分享 电脑端专用链 考虑到不支持 mqqapi 跳转
                                inner_meta.jumpUrl, // 标准卡片
                                inner_meta.jump_url, // “小”程序
                                inner_meta.qqdocurl, // “小”程序(B站我操你妈 天天就会发卡片 还tm这么不规范 垃圾小程序也是 服了)
                                inner_meta.link, // 频道Bot卡片
                            ]))
                        }
                    },
                    {
                        type: "node",
                        data: {
                            name: '满月',
                            uin: '114514',
                            content: textMsg('💮QJSON源代码💮\n' + JSON.stringify(JSON.parse(msg.message[0].data.data)) + '\n\n💮此 JSON卡片 发送者: ' + `${msg.sender.nickname}(${msg.sender.user_id})💮`),
                        }
                    },
                ]
            })
        }
    ],
]

// ======== 功能配置处 ========

module.exports = configList

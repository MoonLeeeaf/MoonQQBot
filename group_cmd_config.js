/**
 * MoonBot
 * Author - GitHub @MoonLeeeaf
 * License - Apache 2.0
 */

const { CqApi, ModTypes, PostTypes } = require('cqhttp-ts')

const { unescapeHTMLEntities, getAtOrThrow, getReplyMessageId, checkAdminOrThrow, setAdmin, configDB, config, checkCoreAdminOrThrow, setCoreAdmin, checkCoreAdmin, checkAdmin, makeSingleForwardMessage, cleanUrl, getAtOrQQOrThrow, checkApiLimitOrThrow, tryCatch } = require('./utils')

// ======== 功能配置处 ========

let authCode = Math.random() + ""

console.log("添加授权: /满月 auth " + authCode)

// 狗头: [CQ:face,id=277]

const configList = [
    [
        /^auth ([^ ]*) ?([^ ]*)? ?(.*)?/,
        'auth <验证码> <用户/core> [core]',
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            if (argv[1] == authCode) {
                let set = setAdmin
                let at = tryCatch(() => getAtOrThrow(argv[2]), 0)

                if (argv[3] == 'core' || (at == 0 && argv[2] == 'core'))
                    set = setCoreAdmin

                if (argv[2] != 'core')
                    set(at, true)
                else
                    set(msg.sender.user_id, true)

                authCode = Math.random() + ""
                console.log("添加授权: /满月 auth " + authCode + ' [core]')

                CqApi.sendGroupMessageApi({
                    group_id: msg.group_id,
                    message: `[CQ:reply,id=${msg.message_id}]现在满月娘可以任${argv[2] != 'core' ? argv[2] : '你'}把玩啦~(不是)`,
                })
            } else {
                CqApi.sendGroupMessageApi({
                    group_id: msg.group_id,
                    message: `[CQ:reply,id=${msg.message_id}]哼! 休想蒙混过关!`,
                })
            }
        },
    ],
    [
        /^权限$/,
        '权限',
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            CqApi.sendGroupMessageApi({
                group_id: msg.group_id,
                message: `[CQ:reply,id=${msg.message_id}]当前权限等级: ${checkCoreAdmin(msg.sender.user_id) ? '核心' : (checkAdmin(msg.sender.user_id) ? '普通' : '无管理')}`,
            })
        }
    ],
    [
        /^看二次元$/,
        '看二次元',
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            checkApiLimitOrThrow()
            let apiList = [
                'https://t.mwm.moe/fj',
                'https://imgapi.xl0408.top/index.php',
            ]

            CqApi.sendGroupMessageApi({
                group_id: msg.group_id,
                message: `[CQ:reply,id=${msg.message_id}]💮请求者: ${msg.sender.nickname}(${msg.sender.user_id})💮[CQ:image,file=${apiList[Math.floor(Math.random() * apiList.length)]}]`,
            })
        }
    ],
    [
        /^清理?链接? (.*)$/,
        '清(理)链(接) <链接>',
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            CqApi.sendGroupMessageApi({
                group_id: msg.group_id,
                message: `[CQ:reply,id=${msg.message_id}]帮你清理好了呢~ 看: ${await cleanUrl(argv[1])}`,
            })
        }
    ],
    [
        /^看美女$/,
        '看美女',
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            checkApiLimitOrThrow()
            let apiList = [
                'https://api.lolimi.cn/API/meizi/api.php?type=image',
            ]

            CqApi.sendGroupMessageApi({
                group_id: msg.group_id,
                message: `[CQ:reply,id=${msg.message_id}]💮请求者: ${msg.sender.nickname}(${msg.sender.user_id})💮[CQ:image,file=${apiList[Math.floor(Math.random() * apiList.length)]}]`,
            })
        }
    ],
    [
        /^网易云 ([0-9]+)$/,
        '网易云 <音乐ID>',
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            let record_link = 'http://music.163.com/song/media/outer/url?id=' + argv[1]

            CqApi.sendGroupMessageApi({
                group_id: msg.group_id,
                message: `[CQ:record,file=${record_link}]`,
            })
        }
    ],
    [
        /^(执行|运行) ([\S\s]*)/,
        '(运行|执行) <JS代码>',
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            checkCoreAdminOrThrow(msg.sender.user_id)

            let send = (msg) => CqApi.sendGroupMessageApi({ group_id: msg.group_id, message: msg + '' })

            let func = new Function('utils', 'argv', 'msg', 'send', 'return async (utils, argv, msg, send) => {' + decodeURIComponent(unescapeHTMLEntities(argv[2])) + '}')()

            let res = await func(require('./utils'), argv, msg, send)

            let result = (res ? `💮返回结果💮 -> ${res}` : '已经执行了，但是执行的代码没有返回值')

            CqApi.sendGroupMessageApi({
                group_id: msg.group_id,
                message: (res ? res.length > 100 : false) ? makeSingleForwardMessage(`${result}\n\n💮请求者: ${msg.sender.nickname}(${msg.sender.user_id})💮`) : `[CQ:reply,id=${msg.message_id}]${result}`,
            })
        }
    ],
    [
        /^重启$/,
        '重启',
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            checkAdminOrThrow(msg.sender.user_id)

            await CqApi.sendGroupMessageApi({
                group_id: msg.group_id,
                message: `[CQ:reply,id=${msg.message_id}]在重启啦~`,
            })
            process.exit(1)
        }
    ],
    [
        /^QMD (开|关)/,
        'QMD <开/关>',
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            if (!config.反qmd) config.反qmd = {}

            let s
            if (argv[1] == '开') {
                s = '已经打开'
                config.反qmd[msg.group_id] = true
            } else if (argv[1] == '关') {
                s = '已经关闭'
                config.反qmd[msg.group_id] = false
            } else
                return

            configDB.update(config)

            CqApi.sendGroupMessageApi({
                group_id: msg.group_id,
                message: `[CQ:reply,id=${msg.message_id}]针对本群的“去你妈的 QQ Markdown 消息”${s}啦~`,
            })
        }
    ],
    [
        /^QJSON (开|关)/,
        'QJSON <开/关>',
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            if (!config.反json) config.反json = {}

            let s
            if (argv[1] == '开') {
                s = '已经打开'
                config.反json[msg.group_id] = true
            } else if (argv[1] == '关') {
                s = '已经关闭'
                config.反json[msg.group_id] = false
            } else
                return

            configDB.update(config)

            CqApi.sendGroupMessageApi({
                group_id: msg.group_id,
                message: `[CQ:reply,id=${msg.message_id}]针对本群的“去你妈的 QQ JSON 卡片消息”${s}啦~`,
            })
        }
    ],
    [
        /^(加精|设精|设置精华|设为精华)$/,
        '{reply} (加精|设精|设置精华|设为精华)',
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            checkAdminOrThrow(msg.sender.user_id)

            let mid = getReplyMessageId(msg)

            let re = await CqApi.setEssenceMsgApi({
                message_id: mid,
            })

            CqApi.sendGroupMessageApi({
                group_id: msg.group_id,
                message: `[CQ:reply,id=${msg.message_id}]${re.result.wording == '' ? '恭喜! ' : '可恶! '}操作${re.result ? (re.result.wording == '' ? '成功' : `失败: ${re.result.wording}`) : '已操作, 但结果未知'}`,
            })
        }],
    [
        /^源代码$/,
        '{reply} 源代码',
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            let mid = getReplyMessageId(msg)

            CqApi.sendGroupMessageApi({
                group_id: msg.group_id,
                message: [
                    {
                        type: 'reply',
                        data: {
                            id: msg.message_id,
                        },
                    },
                    {
                        type: 'text',
                        data: {
                            text: '呐，这是你要的源代码: ' + (await CqApi.getMessageApi({ message_id: mid })).raw_message,
                        },
                    },
                ],
            })
        }
    ],
    [
        /^视频链接$/,
        '{reply} 视频链接',
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            let replyMsg = await CqApi.getMessageApi({ message_id: getReplyMessageId(msg) })

            let l = /\[CQ:video,.*url=(.*),file_id=.*\]/.exec(replyMsg.raw_message)

            let video = unescapeHTMLEntities(l[1])

            CqApi.sendGroupMessageApi({
                group_id: msg.group_id,
                message: makeSingleForwardMessage(`💮视频链接💮\n${video}\n\n💮视频发送者: ${replyMsg.sender.nickname}(${replyMsg.sender.user_id})💮\n💮请求者: ${msg.sender.nickname}(${msg.sender.user_id})💮`) // `[CQ:reply,id=${msg.message_id}]介个视频的链接是紫酱的: ${video}`,
            })
        }
    ],
    [
        /^复读 ?(.*)/,
        '[{reply}] 复读 [内容]',
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            checkAdminOrThrow(msg.sender.user_id)

            if (argv[1])
                CqApi.sendGroupMessageApi({
                    group_id: msg.group_id,
                    message: argv[1],
                })
            else
                CqApi.sendGroupMessageApi({
                    group_id: msg.group_id,
                    message: (await CqApi.getMessageApi({ message_id: getReplyMessageId(msg) })).raw_message,
                })
        }
    ],
    [
        /^authCode$/,
        'authCode',
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            console.log('授权: /满月 auth ' + authCode)

            CqApi.sendGroupMessageApi({
                group_id: msg.group_id,
                message: `[CQ:reply,id=${msg.message_id}]请看VCR (Console)`,
            })
        }
    ],
    [
        /^降权 ?(.*)?$/,
        '降权',
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            checkAdminOrThrow(msg.sender.user_id)

            let qq = getAtOrQQOrThrow(argv[1])

            if (checkCoreAdmin(qq)) {
                setCoreAdmin(qq, false)
                setAdmin(qq, true)
            } else
                setAdmin(qq, false)

            CqApi.sendGroupMessageApi({
                group_id: msg.group_id,
                message: `[CQ:reply,id=${msg.message_id}]满月娘已经按要求操作啦~ (被操作者: ${qq}, 降权到了: ${checkAdmin(qq) ? '普通' : '无管理'})`,
            })
        }
    ],
    [
        /^早安 ?(ignore_time_limit)?$/,
        '早安',
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            if (!config.晚安列表) config.晚安列表 = {}

            let success = [
                `早上好，${msg.sender.nickname}喵~ 你一共睡了${(Date.now() - config.晚安列表[msg.sender.user_id]) / 1000 / 60 / 60}小时 祝你今天也有个愉快的心情哦喵~`,
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
            if (argv[1] == "ignore_time_limit")
                useList = success
            else if (new Date().getHours() >= 5 && new Date().getHours() <= 18)
                if (new Date().getHours() <= 10) {
                    useList = success
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
        /^晚安 ?(ignore_time_limit)?$/,
        '晚安',
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            if (!config.晚安计数 || (new Date(config.晚安_最后时间).getDate() != new Date().getDate())) config.晚安计数 = 0
            if (!config.晚安列表) config.晚安列表 = {}

            let time_ok = new Date().getHours() <= 6 || new Date().getHours() >= 20

            let slept = config.晚安列表[msg.sender.user_id] != null

            if (!slept)
                if (time_ok) config.晚安计数++
                else { }
            else if (new Date(config.晚安列表[msg.sender.user_id]).getDate() != new Date().getDate()) {
                config.晚安列表[msg.sender.user_id] = null
                // byd上面删了你还忘了取消了是吧
                slept = false
                // 都跨日了那必须是 time_ok 的啊
                config.晚安计数++
            }

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

            let useList = (time_ok ?
                (slept ? failed_slept : success)
                : failed_time)

            if (argv[1] == "ignore_time_limit")
                useList = success

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
        /^禁言 (.*) (.*)/,
        '禁言 <@/QQ/all> <时间>',
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            checkAdminOrThrow(msg.sender.user_id)

            let dur = parseInt(argv[2])

            if (argv[1] == 'all')
                CqApi.setGroupWholeBanApi({
                    group_id: msg.group_id,
                    enable: dur <= 0
                })
            else
                CqApi.setGroupBanApi({
                    group_id: msg.group_id,
                    user_id: getAtOrThrow(argv[1]),
                    duration: dur,
                })

            CqApi.sendGroupMessageApi({
                group_id: msg.group_id,
                message: `[CQ:reply,id=${msg.message_id}]满月娘已经按要求操作啦~ (被操作者 ${getAtOrThrow(argv[1])})`,
            })
        }
    ],
]

// ======== 功能配置处 ========

module.exports = configList

/**
 * MoonBot
 * Author - GitHub @MoonLeeeaf
 * License - Apache 2.0
 */

const { CqApi, ModTypes, PostTypes } = require('cqhttp-ts')

const { unescapeHTMLEntities, getAt, getReplyMessageId, checkAdminOrThrow, setAdmin, configDB, config, checkCoreAdminOrThrow, setCoreAdmin, checkCoreAdmin, checkAdmin } = require('./utils')


// ======== 功能配置处 ========

let authCode = Math.random() + ""

console.log("添加授权: /满月 auth " + authCode)

const configList = [
    [
        /^auth ([^ ]*) ?([^ ]*)? ?(.*)?/,
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            if (argv[1] == authCode) {
                let set = setAdmin
                let at = getAt(argv[2])

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
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            CqApi.sendGroupMessageApi({
                group_id: msg.group_id,
                message: `[CQ:reply,id=${msg.message_id}]当前权限等级: ${checkCoreAdmin(msg.sender.user_id) ? '核心' : (checkAdmin(msg.sender.user_id) ? '普通' : '无管理' )}`,
            })
        }
    ],
    [
        /^网易云 ([0-9]+)$/,
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
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            checkCoreAdminOrThrow(msg.sender.user_id)

            let utils = require('./utils')

            CqApi.sendGroupForwardMessageApi({
                group_id: msg.group_id,
                message: `[CQ:reply,id=${msg.message_id}]${new Function('utils', 'argv', 'msg', decodeURIComponent(unescapeHTMLEntities(argv[2])))(config, checkAdminOrThrow, argv, msg)}`,
            })
        }
    ],
    [
        /^重启$/,
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            checkAdminOrThrow(msg.sender.user_id)

            await CqApi.sendGroupForwardMessageApi({
                group_id: msg.group_id,
                message: `[CQ:reply,id=${msg.message_id}]在重启啦~`,
            })
            process.exit(1)
        }
    ],
    [
        /^QMD (开|关)/,
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
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            let l = /\[CQ:video,.*url=(.*),file_id=.*\]/.exec((await CqApi.getMessageApi({ message_id: getReplyMessageId(msg) })).raw_message)

            let video = unescapeHTMLEntities(l[1])

            CqApi.sendGroupMessageApi({
                group_id: msg.group_id,
                message: `[CQ:reply,id=${msg.message_id}]介个视频的链接是紫酱的: ${video}`,
            })
        }
    ],
    [
        /^复读 ?(.*)/,
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
        /^降权/,
        /** @param { PostTypes.GroupMessageType } msg */
        async (argv, msg) => {
            checkAdminOrThrow(msg.sender.user_id)

            if (checkCoreAdmin(msg.sender.user_id))
                setCoreAdmin(msg.sender.user_id, false)
            else
                setAdmin(msg.sender.user_id, false)

            CqApi.sendGroupMessageApi({
                group_id: msg.group_id,
                message: `[CQ:reply,id=${msg.message_id}]满月娘已经按要求操作啦~`,
            })
        }
    ],
    [
        /^禁言 (.*) (.*)/,
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
                    user_id: getAt(argv[1]),
                    duration: dur,
                })

            CqApi.sendGroupMessageApi({
                group_id: msg.group_id,
                message: `[CQ:reply,id=${msg.message_id}]满月娘已经按要求操作啦~`,
            })
        }
    ],
]

// ======== 功能配置处 ========

module.exports = configList

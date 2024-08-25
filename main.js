/**
 * MoonBot
 * Author - GitHub @MoonLeeeaf
 * License - Apache 2.0
 */

const { CqApi, default: linkServer, useMod, ModTypes, PostTypes } = require('cqhttp-ts')

const child_process = require('node:child_process')
const { textMsg, config, setAdmin } = require('./utils')

const io = require('./io')

const versionName = 'v1.0.0'

function forkSelf() {
    child_process.fork('main', ['--child-process'], {}).on('exit', (code) => {
        if (code != 0) forkSelf()
    })
}

if (!process.argv.includes('--child-process')) return forkSelf()

const botConfig = io.open('config.json', 'rw').checkExistsOrWriteJson({
    onebot_server: 'ws://localhost:3001/',
    bot_admin_list: [],
}).readAllJsonAndClose()

/**
 * 清空数组内空白字符项目
 * @param { Array } array 数组
 * @returns { Array } 清理后的数组
 */
function clearEmptyItem(array) {
    let n = []
    array.forEach((v) => {
        if (v != "" && v != null) n.push(v)
    })
    return n
}

linkServer(botConfig.onebot_server).then((loginInfo) => {
    console.log('登录成功')
    const group_cmd_config = require('./group_cmd_config')
    const group_config = require('./group_config')

    botConfig.bot_admin_list.forEach((v) => setAdmin(v, true))

    // 注意: 请在 NapCat 的 OneBot 配置中允许上报自身消息, 否则bot自身无法触发命令

    const built_in_config = [
        [
            /^(指令)?(菜单|指令列表)$/,
            /** @param { PostTypes.GroupMessageType } msg */
            async (argv, msg) => {
                let a = []
                group_cmd_config.forEach((v) => {
                    a.push(v[0].source)
                })
                let b = []
                group_config.forEach((v) => {
                    b.push(v[0].source)
                })

                CqApi.sendGroupForwardMessageApi({
                    group_id: msg.group_id,
                    message: [
                        {
                            type: "node",
                            data: {
                                name: '满月',
                                uin: '114514',
                                content: `💮满月娘娘 - OneBot ${versionName}💮`
                            }
                        },
                        {
                            type: "node",
                            data: {
                                name: '满月',
                                uin: '114514',
                                content: textMsg(`💮普通指令💮\n${a.join('\n')}`)
                            }
                        },
                        {
                            type: "node",
                            data: {
                                name: '满月',
                                uin: '114514',
                                content: textMsg(`💮全局指令💮\n${b.join('\n')}`)
                            }
                        },
                        {
                            type: "node",
                            data: {
                                name: '满月',
                                uin: '114514',
                                content: textMsg(`💮GitHub @MoonLeeeaf💮`)
                            }
                        },
                        {
                            type: "node",
                            data: {
                                name: '满月',
                                uin: '114514',
                                content: textMsg(`💮本指令请求者: ${msg.sender.nickname}(${msg.sender.user_id})💮`)
                            }
                        },
                    ],
                })
            }
        ]
    ]

    useMod.useMessageMod([
        {
            type: 'groupMessageMod',
            name: '满月',
            whiteList: false, // 别因为这个卡了半天
            /**
              * 收到消息回调
              * @param { PostTypes.GroupMessageType } msg 消息对象
              */
            handler: async (msg) => {
                console.log(`[${msg.group_id}] ${msg.sender.nickname}(${msg.sender.user_id}): ${msg.raw_message}`)

                let reg = new RegExp(`^.*(/|\$|#)满月`, 'gs')

                let cmd = clearEmptyItem(msg.raw_message.replace(reg, '').split(' ')).join(' ')

                function forEach(config) {
                    for (let i of config) {
                        if (i[0].test(cmd)) {
                            console.log(cmd)
                            let argv = i[0].exec(cmd)
                            if (argv == null) argv = []
                            i[1](argv, msg).catch((e) => CqApi.sendGroupMessageApi({
                                group_id: msg.group_id,
                                message: `[CQ:reply,id=${msg.message_id}]喵呜呜呜呜! 出错了啦!\n${e}`,
                            }))
                        }
                    }
                }

                if (!reg.test(msg.raw_message))
                    // 不需要使用指定语句调用的命令
                    forEach(group_config)
                else
                    // 需要使用指定语句调用的命令
                    forEach(group_cmd_config)

                forEach(built_in_config)
            }
        }
    ])
})

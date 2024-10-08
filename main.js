/**
 * MoonBot
 * Author - GitHub @MoonLeeeaf
 * License - Apache 2.0
 */

// 记得改版本号, 记得改版本号, 记得改版本号
// 记得改 package.json, 记得改 package.json, 记得改 package.json

const versionName = 'v1.3.0'

const { CqApi, default: linkServer, useMod, ModTypes, PostTypes } = require('cqhttp-ts')

const child_process = require('node:child_process')
const { textMsg, config, setAdmin, makeSingleForwardMessage } = require('./utils')

const io = require('./io')

function forkSelf() {
    child_process.fork('main', ['--child-process'], {}).on('exit', (code) => {
        forkSelf()
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
            /^(指令菜单|指令列表|菜单)$/,
            '(指令菜单|指令列表|菜单)',
            /** @param { PostTypes.GroupMessageType } msg */
            async (argv, msg) => {
                let a = []
                group_cmd_config.forEach((v) => {
                    if (v[1]) a.push(v[1])
                })
                let b = []
                group_config.forEach((v) => {
                    if (v[1]) b.push(v[1])
                })

                CqApi.sendGroupForwardMessageApi({
                    group_id: msg.group_id,
                    message: [
                        {
                            type: "node",
                            data: {
                                name: '满月',
                                uin: '114514',
                                content: `💮满月娘娘(Group) - OneBot ${versionName}💮`
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
                                content: textMsg(`💮请求者: ${msg.sender.nickname}(${msg.sender.user_id})💮`)
                            }
                        },
                        {
                            type: "node",
                            data: {
                                name: '满月',
                                uin: '114514',
                                content: textMsg(`💮指令注释💮\n<> 表必要参数\n[] 表可选参数\n{reply} 表指令需无@回复使用\n() 表关键字可选,或者表示多种关键词触发均可\n\n全局指令:无需加上前缀使用\n普通指令:需要加上前缀使用`)
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
                            i[2](argv, msg).catch((e) => CqApi.sendGroupMessageApi({
                                group_id: msg.group_id,
                                message: (e ? (e + '').length > 100 : false) ? makeSingleForwardMessage(`代码执行异常! ${e}\n\n💮请求者: ${msg.sender.nickname}(${msg.sender.user_id})💮`) : `[CQ:reply,id=${msg.message_id}]喵呜呜呜呜! 出错了啦!\n${e}`,
                            }))
                        }
                    }
                }

                if (reg.test(msg.raw_message)) {
                    // 需要使用指定语句调用的命令
                    forEach(group_cmd_config)
                    forEach(built_in_config)
                } else {
                    // 不需要使用指定语句调用的命令
                    forEach(group_config)
                }
            }
        }
    ])
})

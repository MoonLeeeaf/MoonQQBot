/**
 * MoonBot
 * Author - GitHub @MoonLeeeaf
 * License - Apache 2.0
 */

const DataBase = require('./db')

const { decode : unescapeHTMLEntities } = require('html-entities')

/**
 * 获取回复的消息的 msgid
 * @param { PostTypes.GroupMessageType } msg 
 * @returns { Number } msg_id
 */
function getReplyMessageId(msg) {
    try {
        return /\[CQ:reply,id=-?([0-9]+)\]/.exec(msg.raw_message)[1]
    } catch (e) {
        console.log(`获取回复的 msgid 失败(${msg})`)
        return 0
    }
}

/**
 * 获取所@的 QQ 号
 * @param { String } str CQ码
 * @returns { String } QQ号
 */
function getAt(str) {
    try {
        return /\[CQ:at,qq=([0-9]+)/.exec(str)[1]
    } catch (e) {
        console.log(`获取 at QQ 号失败(${str})`)
        return 0
    }
}

const adminDB = new DataBase('admin_list')
const adminList = adminDB.read()

const configDB = new DataBase('config')
const config = configDB.read()

/**
 * 是否为bot管理员(因为函数集是Promise, 所以随意抛出错误都能被外层 catch 捕捉)
 * @param { Number } qq qq号
 */
function checkAdminOrThrow(qq) {
    if (!checkAdmin(qq)) throw new EvalError('哼! 你没有介个指令的权限!')
}

/**
 * 是否为bot管理员
 * @param { Number } qq qq号
 * @returns { Boolean } 是否管理员
 */
function checkAdmin(qq) {
    return adminList[qq + ""] || checkCoreAdmin(qq)
}

const coreAdminDB = new DataBase('core_admin_list')
const coreAdminList = coreAdminDB.read()

/**
 * 是否为bot核心管理员(因为函数集是Promise, 所以随意抛出错误都能被外层 catch 捕捉)
 * @param { Number } qq qq号
 */
function checkCoreAdminOrThrow(qq) {
    if (!checkCoreAdmin(qq)) throw new EvalError('哼! 你没有介个高级指令的权限!')
}

/**
 * 是否为bot核心管理员
 * @param { Number } qq qq号
 * @returns { Boolean } 是否管理员
 */
function checkCoreAdmin(qq) {
    return coreAdminList[qq + ""]
}

/**
 * 设置bot管理员
 * @param { Number } qq qq号
 * @param { Boolean } is_admin 是否管理员
 */
function setAdmin(qq, v) {
    adminList[qq + ""] = v
    adminDB.update(adminList)
}

/**
 * 设置bot核心管理员
 * @param { Number } qq qq号
 * @param { Boolean } is_core_admin 是否核心管理员
 */
function setCoreAdmin(qq, v) {
    coreAdminList[qq + ""] = v
    coreAdminDB.update(coreAdminList)
}

/**
 * 格式化日期
 * @param { int } 时间戳
 * @param { String } 欲格式化的文本
 * @returns { String } 格式后的文本
 */
function formatDate(tms, format) {
    let tmd = new Date(tms)
    /*
     * 例子: format="YYYY-MM-dd hh:mm:ss";
     */
    var o = {
        "M+": tmd.getMonth() + 1, // month
        "d+": tmd.getDate(), // day
        "h+": tmd.getHours(), // hour
        "m+": tmd.getMinutes(), // minute
        "s+": tmd.getSeconds(), // second
        "q+": Math.floor((tmd.getMonth() + 3) / 3), // quarter
        "S": tmd.getMilliseconds()
        // millisecond
    }
    if (/(y+)/.test(format)) {
        format = format.replace(RegExp.$1, (tmd.getFullYear() + "")
            .substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k]
                : ("00" + o[k]).substr(("" + o[k]).length));
        }
    }
    return format;
}

/**
 * 从一组数据中找一个非Null的值
 * @param { any[] } list 一组数据
 *@param { any } defaultValue 默认值
 * @returns { any } 非 null 的数据，若均 null 则返回 defaultValue
 */
function findNonNull(ls, defaultValue) {
    let a = defaultValue
    ls.forEach((v) => {
        if (v) a = v
    })
    return a
}

/**
 * 以单条消息生成合并转发消息
 * @param { Array | String } message 消息
 * @returns { Array } 合并转发消息
 */
function makeSingleForwardMessage(message) {
    return [
        {
            type: "node",
            data: {
                name: '满月',
                uin: '114514',
                content: message,
            }
        },
    ]
}

/**
 * 构建纯文本消息
 * @param { String } msg 文本消息
 * @returns { Array } msg
 */
function textMsg(msg) {
    return [
        {
            type: 'text',
            data: {
                text: msg
            }
        }
    ]
}

module.exports = {
    getReplyMessageId: getReplyMessageId,
    getAt: getAt,
    unescapeHTMLEntities: unescapeHTMLEntities,
    checkAdmin: checkAdmin,
    checkAdminOrThrow: checkAdminOrThrow,
    checkCoreAdmin: checkCoreAdmin,
    checkCoreAdminOrThrow: checkCoreAdminOrThrow,
    setAdmin: setAdmin,
    setCoreAdmin: setCoreAdmin,
    formatDate: formatDate,
    makeSingleForwardMessage: makeSingleForwardMessage,
    findNonNull, findNonNull,
    textMsg: textMsg,
    adminList: adminList,
    adminDB: adminDB,
    coreAdminList: coreAdminList,
    coreAdminDB: coreAdminDB,
    configDB: configDB,
    config: config,
}

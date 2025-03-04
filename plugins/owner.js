//---------------------------------------------
//           EMPIRE-MD  
//---------------------------------------------
//  @project_name : EMPIRE-MD  
//  @author       : efeurhobo  
//  ⚠️ DO NOT MODIFY THIS FILE ⚠️  
//---------------------------------------------

const config = require('../config');
const { cmd, commands } = require('../command');
const { proto, downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { sms,downloadMediaMessage } = require('../Lib/msg');
const fs = require('fs');
const exec = require('child_process');
const path = require('path');
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, sleep, fetchJson } = require('../Lib/functions');
const ownerNumber = [config.OWNER_NUMBER];
const prefix = config.PREFIX;




cmd({
    pattern: "chatbot",
    desc: "Enable or Disable Chatbot",
    category: "owner",
    react: "🤖",
    filename: __filename
}, async (conn, mek, m, { from, body, isGroup, isOwner, q, isAdmins, isBotAdmins, reply }) => {
    try {
        if (!isOwner) return reply('❌ This command is for the owner only!');
        
        const infoMess = {
            image: { url: global.botpic },
            caption: `> *𝙴𝙼𝙿𝙸𝚁𝙴-𝙼𝙳*  

Reply with:

*1.* Enable Public Chatbot
*2.* Enable Chatbot in Groups
*3.* Enable Chatbot in Inbox
*4.* Disable Public Chatbot

╭────────────────◆  
│ ${global.footer}
╰─────────────────◆`,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 5,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                  newsletterJid: '120363337275149306@newsletter',
                  newsletterName: global.botname,
                  serverMessageId: 143
                }
            }
        };

        const messageSent = await conn.sendMessage(from, infoMess, { quoted: mek });
        const messageId = messageSent.key.id;

        conn.ev.on("messages.upsert", async (event) => {
            const messageData = event.messages[0];
            if (!messageData.message) return;

            const messageContent = messageData.message.conversation || messageData.message.extendedTextMessage?.text;
            const isReplyToPrompt = messageData.message.extendedTextMessage?.contextInfo?.stanzaId === messageId;

            if (isReplyToPrompt) {
                await m.react("🤖");
                switch (messageContent) {
                    case "1": 
                        chatbotEnabled = true;
                        return reply("*Chatbot has been enabled globally (all chats)!*");
                    case "2": 
                        chatbotInGroups = true;
                        chatbotInInbox = false;
                        return reply("*Chatbot will work only in group chats!*");
                    case "3": 
                        chatbotInInbox = true;
                        chatbotInGroups = false;
                        return reply("*Chatbot will work only in personal chats (inbox)!*");
                    case "4": 
                        chatbotEnabled = false;
                        return reply("*Chatbot has been disabled globally (all chats)!*");
                    default:
                        return conn.sendMessage(from, { text: "❌ Invalid option selected. Please reply with a valid number (1, 2, 3, or 4)." });
                }
            }
        });

        await m.react("✅");
    } catch (e) {
        console.log(e);
        reply(`❌ Error: ${e}`);
    }
});

cmd({
    on: "body"
}, async (conn, mek, m, { from, body, isMe, isOwner, isGroup, reply }) => {
    try {
        if (chatbotEnabled) {
            if (isMe) return;  // Ignore bot's own messages
            
            // Ensure chatbot is only active in the appropriate channels
            if ((chatbotInGroups && !isGroup) || (chatbotInInbox && isGroup)) {
                return;
            }

            const q = body;

            // Try fetching response from the Gemini API using fetchJson
            let data;
            try {
                data = await fetchJson("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyAFz10SMFS4Szaz6noZcjurMNWeGG0n8Cg", {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: q }]
                        }]
                    })
                });
                
                if (data && data.contents) {
                    const result = data.contents[0].parts[0].text;
                    return reply(result);
                }
            } catch (e) {
                console.log('Gemini API failed or no valid response:', e);
            }

            return reply("❌ Sorry, I couldn't generate a response. Please try again later.");
        }
    } catch (error) {
        console.error(error);
        reply("❌ An unexpected error occurred.");
    }
});

//--------------------------------------------
//  BLOCK COMMANDS
//--------------------------------------------
cmd({
    pattern: "block",
    desc: "Block a user.",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, q, reply }) => {
    if (!isOwner) return reply("❌ You are not the owner!");
    if (!mek.quoted) return reply("❌ Please reply to the user you want to block.");

    const user = mek.quoted.sender;
    try {
        await conn.updateBlockStatus(user, 'block');
        reply('🚫 User ' + user + ' blocked successfully.');
    } catch (err) {
        console.error(err);
        await conn.sendMessage(from, { text: `❌ Failed to block the user: ${err.message}` }, { quoted: mek });
    }
});
//--------------------------------------------
// UN-BLOCK COMMANDS
//--------------------------------------------
cmd({
    pattern: "unblock",
    desc: "Unblock a user.",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, q, reply }) => {
    if (!isOwner) return reply("❌ You are not the owner!");
    if (!mek.quoted) return reply("❌ Please reply to the user you want to unblock.");

    const user = mek.quoted.sender;
    try {
        await conn.updateBlockStatus(user, 'unblock');
        reply('✅ User ' + user + ' unblocked successfully.');
    } catch (err) {
        console.error(err);
        await conn.sendMessage(from, { text: `❌ Failed to unblock the user: ${err.message}` }, { quoted: mek });
    }
});

cmd({
    pattern: "readmore",
    desc: "Adds *readmore* in given text.",
    category: "owner",
    filename: __filename
}, 
async (conn, mek, m, { q }) => {
    if (!q) return await conn.sendMessage(m.chat, { text: "❌ Please provide text to apply readmore!" }, { quoted: mek });

    const readMore = String.fromCharCode(8206).repeat(4001);
    const result = q.replace(/\+/g, readMore);

    await conn.sendMessage(m.chat, { text: result }, { quoted: mek });
});

//--------------------------------------------
//  OWNER COMMANDS
//--------------------------------------------
cmd({
    pattern: "owner",
    desc: "Sends the owner's VCard.",
    category: "owner",
    filename: __filename,
}, async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const number = config.OWNER_NUMBER || "+2348078582627";
        const name = config.OWNER_NAME || "𝙴𝚖𝚙𝚒𝚛𝚎 𝚃𝚎𝚌𝚑";
        const info = global.botname || "𝙴𝙼𝙿𝙸𝚁𝙴-𝙼𝙳";

        const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nORG:${info};\nTEL;type=CELL;type=VOICE;waid=${number.replace("+", "")}:${number}\nEND:VCARD`;

        await conn.sendMessage(from, { 
            contacts: { 
                displayName: name, 
                contacts: [{ vcard }] 
            },
            contextInfo: {
    externalAdReply: {
        title: global.botname || "𝙴𝙼𝙿𝙸𝚁𝙴-𝙼𝙳",
        body: "𝙲𝚘𝚗𝚝𝚊𝚌𝚝 𝚝𝚑𝚎 𝚘𝚠𝚗𝚎𝚛",
        renderLargerThumbnail: true,
        thumbnailUrl: "https://files.catbox.moe/z7c67w.jpg",
        mediaType: 2,
        sourceUrl: `https://wa.me/${number.replace("+", "")}?text=Hello, I am ${pushname}`
    }
}
        }, { quoted: mek });
    } catch (error) {
        console.error("Error in owner command:", error);
        reply("❌ An error occurred while sending the VCard.");
    }
});
//--------------------------------------------
//  DEVELOPER COMMANDS
//--------------------------------------------
cmd({
    pattern: "developer",
    desc: "Sends the developer VCard.",
    category: "owner",
    filename: __filename,
}, async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        const number = global.devs || "2348078582627";
        const name = "𝙴𝚖𝚙𝚒𝚛𝚎 𝚃𝚎𝚌𝚑";
        const info = global.botname || "𝙴𝙼𝙿𝙸𝚁𝙴-𝙼𝙳";

        const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${name}\nORG:${info};\nTEL;type=CELL;type=VOICE;waid=${number.replace("+", "")}:${number}\nEND:VCARD`;

        await conn.sendMessage(from, { 
            contacts: { 
                displayName: name, 
                contacts: [{ vcard }] 
            },
            contextInfo: {
    externalAdReply: {
        title: global.botname || "𝙴𝙼𝙿𝙸𝚁𝙴-𝙼𝙳",
        body: "𝙲𝚘𝚗𝚝𝚊𝚌𝚝 𝚝𝚑𝚎 𝙳𝚎𝚟𝚎𝚕𝚘𝚙𝚎𝚛",
        renderLargerThumbnail: true,
        thumbnailUrl: "https://files.catbox.moe/z7c67w.jpg",
        mediaType: 2,
        sourceUrl: `https://wa.me/${number.replace("+", "")}?text=Hello Developer, i am  ${pushname}`
    }
}
        }, { quoted: mek });
    } catch (error) {
        console.error("Error in owner command:", error);
        reply("❌ An error occurred while sending the VCard.");
    }
});

cmd({
    pattern: "edit",
    desc: "Edit sent messages.",
    category: "owner",
    filename: __filename
}, async (conn, mek, m, { quoted, q, reply }) => {
    if (!quoted) return reply("⚠️ Reply to a message with `.edit <new text>` to edit it.");
    if (!q) return reply("⚠️ Provide the new text to edit the message.\nExample: `.edit New text`");

    try {
        await conn.sendMessage(m.chat, { text: q, edit: quoted.key });
    } catch (e) {
        console.error(e);
        reply(`❌ Error: ${e.message}`);
    }
});
//--------------------------------------------
//  JID COMMANDS
//--------------------------------------------
cmd({
    pattern: "jid",
    desc: "Get the Bot's JID.",
    category: "owner",
    react: "🤖",
    filename: __filename
},
async (conn, mek, m, { from, isOwner, reply }) => {
    if (!isOwner) return reply("❌ You are not the owner!");
    reply(`🤖 *Bot JID:* ${conn.user.id}`);
});
//--------------------------------------------
//  DONATE COMMANDS
//--------------------------------------------
cmd({
    pattern: "aza",
    alias: ["donate"],
    desc: "Get owner details",
    category: "owner",
    filename: __filename
}, async (conn, mek, m, { from, quoted }) => {
    try {
        let madeMenu = `
╭────「 𝙴𝙼𝙿𝙸𝚁𝙴-𝙼𝙳 」────◆  
│ ∘ 𝙽𝚊𝚖𝚎: 𝙴𝚏𝚎𝚞𝚛𝚑𝚘𝚋𝚘 𝙱𝚞𝚕𝚕𝚒𝚜𝚑  
│ ∘ 𝙰𝚌𝚌: 8078582627  
│ ∘ 𝙱𝚊𝚗𝚔: 𝙾𝚙𝚊𝚢  
│ ∘ 𝙽𝚘𝚝𝚎: 𝚂𝚌𝚛𝚎𝚎𝚗𝚜𝚑𝚘𝚝 𝚊𝚏𝚝𝚎𝚛 𝚙𝚊𝚢𝚖𝚎𝚗𝚝 .
╰────────────────────`;

        await conn.sendMessage(from, { 
            image: { 
                url: "https://files.catbox.moe/z7c67w.jpg"
            }, 
            caption: madeMenu 
        }, { quoted: mek });
    } catch (e) {
        console.log(e);
        await conn.sendMessage(from, { text: `${e}` }, { quoted: mek });
    }
});
//--------------------------------------------
// SET-PP COMMANDS
//--------------------------------------------
cmd({
    pattern: "setpp",
    desc: "Set bot profile picture.",
    category: "owner",
    react: "🖼️",
    filename: __filename
}, async (conn, mek, m, { quoted, reply, isOwner }) => {
    if (!isOwner) return reply("❌ You are not the owner!");
    if (!quoted || !quoted.image) return reply("⚠️ Reply to an image to set as profile picture.");

    try {
        let media = await quoted.download();
        await conn.updateProfilePicture(conn.user.id, media);
        reply("✅ Profile picture updated successfully.");
    } catch (e) {
        console.error(e);
        reply(`❌ Error: ${e.message}`);
    }
});
//--------------------------------------------
//  SETNAME COMMANDS
//--------------------------------------------
cmd({
    pattern: "setname",
    desc: "Set User name",
    category: "owner",
    filename: __filename
},
async (conn, mek, m, { isOwner, q, reply }) => {
    if (!isOwner) return reply("❌ You are not the owner!");
    if (!q) return reply("❌ Enter a name!");
    
    try {
        await conn.updateProfileName(q);
        reply(`✅ Username updated to: ${q}`);
    } catch (error) {
        console.error("Error updating username:", error);
        reply(`❌ Error updating username: ${error.message}`);
    }
});
//--------------------------------------------
//  VV COMMANDS
//--------------------------------------------
cmd({
    pattern: "vv",
    desc: "Get view once.",
    category: "owner",
    react: "👀",
    filename: __filename
}, async (conn, mek, m, { isReply, quoted, reply }) => {
    try {
        // Check if the message is a view once message
        if (!m.quoted) return reply("Please reply to a view once message!");

        const qmessage = m.message.extendedTextMessage.contextInfo.quotedMessage;
        
            const mediaMessage = qmessage.imageMessage ||
                                qmessage.videoMessage ||
                                qmessage.audioMessage;
                                
            if (!mediaMessage?.viewOnce) {
              return reply("_Not A VV message")
            }

            try {
            const buff = await m.quoted.getbuff
            const cap = mediaMessage.caption || '';
            
            if (mediaMessage.mimetype.startsWith('image')) {
                  await conn.sendMessage(m.chat, {
                  image: buff,
                 caption: cap
         }); 
            } else if (mediaMessage.mimetype.startsWith('video')) {
              await conn.sendMessage(m.chat, {
                  video: buff,
                 caption: cap
         }); 
            } else if (mediaMessage.mimetype.startsWith('audio')) {
              await conn.sendMessage(m.chat, {
                  audio: buff,
                  ptt: mediaMessage.ptt || false
         }); 
            } else {
              return reply("_*Unkown/Unsupported media*_");
        }
    } catch (error) {
        console.error(error);
        reply(`${error}`)
    }
} catch (e) {
  console.error(e);
        reply(`${e}`);
}
});
//--------------------------------------------
//  VV-2 COMMANDS
//--------------------------------------------
cmd({
    pattern: "vv2",
    desc: "Get view once to owner chat.",
    category: "owner",
    react: "👀",
    filename: __filename
}, async (conn, mek, m, { isReply, quoted, reply }) => {
    try {
        if (!m.quoted) return reply("Please reply to a view once message!");

        const qmessage = m.message.extendedTextMessage.contextInfo.quotedMessage;
        const mediaMessage = qmessage.imageMessage ||
                             qmessage.videoMessage ||
                             qmessage.audioMessage;

        if (!mediaMessage?.viewOnce) {
            return reply("_Not A VV message_");
        }

        try {
            const buff = await m.quoted.getbuff;
            const cap = mediaMessage.caption || '';

            if (mediaMessage.mimetype.startsWith('image')) {
                await conn.sendMessage(`${ownerNumber}@s.whatsapp.net`, {
                    image: buff,
                    caption: cap
                }); 
            } else if (mediaMessage.mimetype.startsWith('video')) {
                await conn.sendMessage(`${ownerNumber}@s.whatsapp.net`, {
                    video: buff,
                    caption: cap
                }); 
            } else if (mediaMessage.mimetype.startsWith('audio')) {
                await conn.sendMessage(`${ownerNumber}@s.whatsapp.net`, {
                    audio: buff,
                    ptt: mediaMessage.ptt || false
                }); 
            } else {
                return reply("_*Unknown/Unsupported media*_");
            }
        } catch (error) {
            console.error(error);
            reply(`${error}`);
        }
    } catch (e) {
        console.error(e);
        reply(`${e}`);
    }
});
//--------------------------------------------
//  SAVE COMMANDS
//--------------------------------------------
cmd({
    pattern: "save",
    desc: "Get status or media message.",
    category: "owner",
    react: "👀",
    filename: __filename
}, async (conn, mek, m, { from, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isAdmins, reply }) => {
    try {
        if (!quoted) return reply("Please reply to a media message!");

        try {
            const buff = await quoted.getbuff;
            const cap = quoted.msg.caption || '';

            if (quoted.type === 'imageMessage') {
                await conn.sendMessage(`${ownerNumber}@s.whatsapp.net`, {
                    image: buff,
                    caption: cap
                }); 
            } else if (quoted.type === 'videoMessage') {
                await conn.sendMessage(`${ownerNumber}@s.whatsapp.net`, {
                    video: buff,
                    caption: cap
                }); 
            } else if (quoted.type === 'audioMessage') {
                await conn.sendMessage(`${ownerNumber}@s.whatsapp.net`, {
                    audio: buff,
                    ptt: quoted.msg.ptt || false
                }); 
            } else {
                return reply("_*Unknown/Unsupported media*_");
            }
        } catch (error) {
            console.error(error);
            reply(`${error}`);
        }
    } catch (e) {
        console.error(e);
        reply(`${e}`);
    }
});


cmd({
    pattern: "getpp",
    desc: "Fetch the profile picture of a tagged or replied user.",
    category: "owner",
    filename: __filename
}, async (conn, mek, m, { quoted, isGroup, sender, participants, reply }) => {
    try {
        // Determine the target user
        const targetJid = quoted ? quoted.sender : sender;

        if (!targetJid) return reply("⚠️ Please reply to a message to fetch the profile picture.");

        // Fetch the user's profile picture URL
        const userPicUrl = await conn.profilePictureUrl(targetJid, "image").catch(() => null);

        if (!userPicUrl) return reply("⚠️ No profile picture found for the specified user.");

        // Send the user's profile picture
        await conn.sendMessage(m.chat, {
            image: { url: userPicUrl },
            caption: "🖼️ Here is the profile picture of the specified user."
        });
    } catch (e) {
        console.error("Error fetching user profile picture:", e);
        reply("❌ An error occurred while fetching the profile picture. Please try again later.");
    }
});
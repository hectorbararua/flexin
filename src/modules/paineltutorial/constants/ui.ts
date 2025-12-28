export const CUSTOM_IDS = {
    BUTTON_TOKEN: 'paineltutorial:btn_token',
    BUTTON_STATUS: 'paineltutorial:btn_status',
    BUTTON_TUTORIAL_IPHONE: 'paineltutorial:btn_iphone',
    BUTTON_TUTORIAL_PC: 'paineltutorial:btn_pc',
    BUTTON_TUTORIAL_ANDROID: 'paineltutorial:btn_android',
    MODAL_TOKEN: 'paineltutorial:modal_token'
} as const;

export const INPUT_IDS = {
    TOKEN: 'token_input'
} as const;

export const EMOJIS = {
    WARNING: '⚠️'
} as const;

export const COLORS = {
    PRIMARY: '#FFFFFF',
    SUCCESS: '#57F287'
} as const;

export const PAINEL_CONFIG = {
    TITLE: 'Tutorial Token',
    IMAGE: 'https://cdn.discordapp.com/attachments/1452449457168715828/1452464599432433756/6F24FC15-D514-4A71-B94A-1CB5F7CC0A41.gif?ex=6949e891&is=69489711&hm=4dcf4b6a717a12ca23a790cb86a1cff1e0946db0de47d8b2cccbf6a31778c788&',
    DESCRIPTION: `Para usar o **CL** e **Call**, você precisa conectar sua conta primeiro.

**Conectar Token**
Vincula sua conta ao bot.

**iPhone / Android / PC**
Tutoriais de como pegar sua token.

• Todos os botões explicam como pegar a token, caso tenha duvida de como usar o painel só ler a mensagem do <#1452064389866721400>, <#1452056047023034489>, só clicar em cada botão que ele faz automaticamente.
`
} as const;

export const BUTTON_LABELS = {
    TOKEN: 'Conectar Token',
    STATUS: 'Status',
    TUTORIAL_IPHONE: 'iPhone',
    TUTORIAL_PC: 'PC',
    TUTORIAL_ANDROID: 'Android'
} as const;

export const TUTORIALS = {
    IPHONE: {
        TITLE: 'Tutorial iPhone',
        STEPS: `**1.** Baixe **Google Chrome** na App Store
**2.** Acesse **discord.com/app** e faça login
**3.** Copie o código acima
**4.** Cole na **barra de URL**
**5.** Adicione **javascript:** no começo (o Chrome remove)
**6.** Aperte **Ir** e copie sua token!`,
        CODE: `javascript:webpackChunkdiscord_app.push([[Symbol()],{},r=>{for(let m of Object.values(r.c)){try{let tok=m.exports?.default?.getToken?.();if(tok&&typeof tok==="string"&&tok.length>50){let w=window.open("","_blank","width=600,height=200");w.document.write("<html><body style='background:#1a1a1a;color:#fff;font-family:Arial;padding:20px;'><h2 style='color:#5865F2;'>🔑 Sua Token</h2><p style='background:#2d2d2d;padding:15px;border-radius:8px;word-break:break-all;color:#00ff00;'>"+tok+"</p></body></html>");return}}catch(e){}}}])`
    },
    ANDROID: {
        TITLE: 'Tutorial Android',
        STEPS: `**1.** Baixe **Google Chrome** na Play Store
**2.** Acesse **discord.com/app** e faça login
**3.** Copie o código acima
**4.** Cole na **barra de URL**
**5.** Adicione **javascript:** no começo (o Chrome remove)
**6.** Aperte **Enter** e copie sua token!`,
        CODE: `javascript:webpackChunkdiscord_app.push([[Symbol()],{},r=>{for(let m of Object.values(r.c)){try{let tok=m.exports?.default?.getToken?.();if(tok&&typeof tok==="string"&&tok.length>50){let w=window.open("","_blank","width=600,height=200");w.document.write("<html><body style='background:#1a1a1a;color:#fff;font-family:Arial;padding:20px;'><h2 style='color:#5865F2;'>🔑 Sua Token</h2><p style='background:#2d2d2d;padding:15px;border-radius:8px;word-break:break-all;color:#00ff00;'>"+tok+"</p></body></html>");return}}catch(e){}}}])`
    },
    PC: {
        TITLE: 'Tutorial PC',
        STEPS: `**1.** Abra o **Google Chrome**
**2.** Acesse **discord.com/app** e faça login
**3.** Aperte **F12** → Aba **Console**
**4.** Digite **allow pasting** e aperte Enter
**5.** Cole o código acima e aperte Enter
**6.** Copie sua token!`,
        CODE: `webpackChunkdiscord_app.push([[Symbol()],{},r=>{for(let m of Object.values(r.c)){try{let tok=m.exports?.default?.getToken?.();if(tok&&typeof tok==="string"&&tok.length>50){let w=window.open("","_blank","width=600,height=200");w.document.write("<html><body style='background:#1a1a1a;color:#fff;font-family:Arial;padding:20px;'><h2 style='color:#5865F2;'>🔑 Sua Token</h2><p style='background:#2d2d2d;padding:15px;border-radius:8px;word-break:break-all;color:#00ff00;'>"+tok+"</p></body></html>");return}}catch(e){}}}])`
    }
} as const;

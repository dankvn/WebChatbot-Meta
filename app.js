import bot from "@bot-whatsapp/bot";
import MockAdapter from "@bot-whatsapp/database/mock";
import MetaProvider from "@bot-whatsapp/provider/meta";
import GoogleSheetService from "./services/sheets/index.js";
import  "dotenv/config.js"
const googlesheet = new GoogleSheetService(
    "1sjSk6t983zc9ZeojTdiLn67tN4W854Ekcjq75Dwfga8"
  );
  
  const flujoUsuariosRegistrados = bot
  .addKeyword("USUARIOS_REGISTRADOS")
  .addAnswer(
    "Bienvenidos a Pelletier & Co.* ",
    null,
    async (ctx, { flowDynamic }) => {
      const telefono = ctx.from;
      const ifExist = await googlesheet.validatePhoneNumber(telefono);

      const mensaje = `hola ${ifExist.Nombre},que producto  deseas comprar te enevio una lista de productos `;
      await flowDynamic(mensaje);
      
    }
  );
  

const flujoUsuariosNORegistrados = bot
  .addKeyword("USUARIOS_NO_REGISTRADOS")
  .addAnswer("no esta autorizado para ingrezara al bot");

const flowBienvenida = bot
  .addKeyword("hola")
  .addAnswer("```consultando en base de datos si existe el numero registrado....```", null, async (ctx, { gotoFlow }) => {
    const telefono = ctx.from;
    console.log(
      "consultando en base de datos si existe el numero registrado...."
    );

    const ifExist = await googlesheet.validatePhoneNumber(telefono);
    console.log(ifExist);

    if (ifExist) {
      // Si existe lo enviamos al flujo de regostrados..
      gotoFlow(flujoUsuariosRegistrados);
    } else {
      // Si NO existe lo enviamos al flujo de NO registrados..
      gotoFlow(flujoUsuariosNORegistrados);
    }
  });


const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = bot.createFlow([
        flowBienvenida,
        flujoUsuariosNORegistrados,
        flujoUsuariosRegistrados,
    ])

    const adapterProvider = bot.createProvider(MetaProvider, {
        jwtToken: process.env.JWTOKEN,
        numberId: process.env.NUMBER_ID,
        verifyToken: process.env.VERIFY_TOKEN,
        version: 'v16.0',
    })

    bot.createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })
}

main()

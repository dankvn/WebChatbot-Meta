import bot from "@bot-whatsapp/bot";
import MockAdapter from "@bot-whatsapp/database/mock";
import MetaProvider from "@bot-whatsapp/provider/meta";
import GoogleSheetService from "./services/sheets/index.js";
import  "dotenv/config.js"
const googlesheet = new GoogleSheetService(
  "1sjSk6t983zc9ZeojTdiLn67tN4W854Ekcjq75Dwfga8"
);

const GLOBAL_STATE = [];



const flujoMenu = bot
  .addKeyword("PRODUCTOS")
  .addAnswer([
    "¿Como podemos ayudarte?",
    "",
    "*1-*🛍Realizar *Pedido*",
    "*2-*👨‍💻Contactar con *Agente* ",
  ])
  
  .addAnswer("Responda con el numero de la opcion!");

const flujoError = bot.addKeyword("ERROR").addAnswer("ERROR");

const flujoUsuariosRegistrados = bot
  .addKeyword("USUARIOS_REGISTRADOS")
  .addAction(async (ctx, { flowDynamic, gotoFlow }) => {
    const telefono = ctx.from;
    const ifExist = await googlesheet.validatePhoneNumber(telefono);
    const mensaje = `👋Hola ${ifExist.Nombre}, soy tu asistente virtual `;

    await flowDynamic(mensaje);
    if (ifExist) {
      // Si existe lo enviamos al flujo de regostrados..
      gotoFlow(flujoMenu);
    } else {
      // Si NO existe lo enviamos al flujo de NO registrados..
      gotoFlow(flujoError);
    }
  });

const flujoUsuariosNORegistrados = bot
  .addKeyword("USUARIOS_NO_REGISTRADOS")
  .addAnswer("no esta autorizado para ingrezara al bot");

//Inicio de flow //.
const flowPrincipal = bot
  .addKeyword("hola")
  .addAnswer(
    ["*Bienvenidos a Pelletier&Co.*"],
    null,
    async (ctx, { gotoFlow }) => {
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
    }
  );


const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = bot.createFlow([
        flowPrincipal,
        flujoUsuariosNORegistrados,
        flujoUsuariosRegistrados,
    ])

    const adapterProvider = bot.createProvider(MetaProvider, {
        jwtToken: process.env.JWTOKEN,
        numberId: process.env.NUMBER_ID,
        verifyToken: process.env.VERIFY_TOKEN,
        version: 'v17.0',
    })

    bot.createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })
}

main()

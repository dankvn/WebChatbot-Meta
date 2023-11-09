import bot from "@bot-whatsapp/bot";
import MockAdapter from "@bot-whatsapp/database/mock";
import MetaProvider from "@bot-whatsapp/provider/meta";
import GoogleSheetService from "./services/sheets/index.js";
import  "dotenv/config.js"
const googlesheet = new GoogleSheetService(
  "1sjSk6t983zc9ZeojTdiLn67tN4W854Ekcjq75Dwfga8"
);

const GLOBAL_STATE = [];

const flowPedido = bot
  .addKeyword(["pedir"], { sensitive: true })
  .addAnswer("¿Cual es tu nombre?");

const flujoProducto = bot
  .addKeyword(["1"])
  .addAnswer(
    `Te envio la siguiente lista de *productos:*`,
    { delay: 1000 },

    async (_, { flowDynamic }) => {
      // Reemplaza la llamada a retriveDayMenu() con una llamada a retriveColumnData(0)
      const getMenu = await googlesheet.retrieveColumnData(0);
      for (const menu of getMenu) {
        GLOBAL_STATE.push(menu);
        await flowDynamic(menu);
        await delay(500);
      }
    }
  )
  .addAnswer(
    `Te interesa alguno?`,
    { capture: true },
    async (ctx, { gotoFlow, state }) => {
      const txt = ctx.body;
      const check = await chatgpt.completion(`
    Hoy el menu de comida es el siguiente:
    "
    ${GLOBAL_STATE.join("\n")}
    "
    El cliente quiere "${txt}"
    Basado en el menu y lo que quiere el cliente determinar (EXISTE, NO_EXISTE).
    La orden del cliente
    `);

      const getCheck = check.data.choices[0].text
        .trim()
        .replace("\n", "")
        .replace(".", "")
        .replace(" ", "");

      if (getCheck.includes("NO_EXISTE")) {
        return gotoFlow(flowEmpty);
      } else {
        state.update({pedido:ctx.body})
        return gotoFlow(flowPedido);
      }
    }
  );

const flowEmpty = bot
  .addKeyword(bot.EVENTS.ACTION)
  .addAnswer("No te he entendido!", null, async (_, { gotoFlow }) => {
    return;
  });

const flujoAgente = bot
  .addKeyword(["2"])
  .addAnswer("Estamos desviando tu conversacion a nuestro agente");

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

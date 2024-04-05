import bot from "@bot-whatsapp/bot";
import MockAdapter from "@bot-whatsapp/database/mock";
import MetaProvider from "@bot-whatsapp/provider/meta";
import GoogleSheetService from "./services/sheets/index.js";
import "dotenv/config.js";
import GPTFREE from "gpt4free-plugin"
const googlesheet = new GoogleSheetService(
  "1sjSk6t983zc9ZeojTdiLn67tN4W854Ekcjq75Dwfga8"
);

const GLOBAL_STATE = [];
const gpt = new GPTFREE();

const flowPrincipal = addKeyword(EVENTS.WELCOME)
.addAction(
  async (ctx, { flowDynamic }) => {
    
    const text = ctx.body;
    
    const messages =[
      { role:"assistant", content:""},
      { role: "user", content: text },
    ]

    const options = {
      model:"gpt-4",
      prompt:""
    }

  const response = await gpt.chatCompletions(messages,options);

   console.log(`${new Date()}\nPregunta: ${text} \nRespuesta: ${response}`);
   await flowDynamic (response)



  }
);


const main = async () => {
  const adapterDB = new MockAdapter();
  const adapterFlow = bot.createFlow([ 
    flowPrincipal,
    flujoUsuariosNORegistrados,
    flujoUsuariosRegistrados,
  ]);

  const adapterProvider = bot.createProvider(MetaProvider, {
    jwtToken: process.env.JWTOKEN,
    numberId: process.env.NUMBER_ID,
    verifyToken: process.env.VERIFY_TOKEN,
    version: "v17.0",
  });

  bot.createBot({
    flow: adapterFlow,
    provider: adapterProvider,
    database: adapterDB,
  });
};

main();

/**
 * Migrate transaction categories
 *
 * Usage:
 *   DATABASE_URL=<url> npx tsx scripts/migrate-transaction-categories.ts
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const { Pool } = pg;

const C = {
  outrasDespesas: "a57f1649-5af7-4811-89af-95d7ce99755c",

  mercado: "26885cc8-f2be-4e32-b23f-456af07d286d",
  hortifruti: "eb113956-3f24-4851-bed6-c2c03b4a3c79",
  padaria: "dc18164b-7cb0-4f73-925e-bbe6a2ff7f2b",
  doceria: "5ef800d3-f187-48dd-a45f-7d590eddf225",
  emporio: "b4bdd609-9658-4d4b-81ac-837db21e92a8",
  cafesSorvete: "0e5f7e06-2361-4644-9841-8cd1811b9408",
  delivery: "c61d72ec-e7b9-40f2-bcbe-7350a2122346",

  uberTaxi: "e1fd32bd-8200-4ff6-8baa-2b4e3873c5b4",
  estacionamento: "c75eb666-0371-4fc9-9935-42e39d095104",
  zonaAzul: "7aa45d1c-0caa-451b-a873-d6312cdf8d42",
  conducao: "73062310-9159-4676-b331-2ea47f542a21",
  combustivel: "9ffba3ec-9ca3-49f9-8300-5a373b6c578a",

  farmacia: "9aecec3b-a356-4aae-907d-bca0fb95047c",
  dentista: "87aeb904-c3f3-4c82-b21d-3fe6ba418c1c",
  exame: "a14d6455-44b4-4307-b383-4c003950701e",
  convenio: "8647e145-7781-4812-9113-b5fae285c854",

  agua: "be7248c7-bd61-4a83-b4fb-768a7534ccb0",
  luz: "e769341c-0c40-4f42-a3d8-92e7938bc158",
  internetTelefone: "80bec88c-9ff8-4f21-bdcd-a576e6d1a40a",
  floricultura: "a26c8dad-be5a-4bb7-9bff-d047fc160694",
  manutencaoCasa: "3732c3b5-bb89-495d-8867-344b66781459",
  gas: "945b067f-4336-4f93-a670-e199a2841c42",

  salao: "77d06e4e-4f4d-4330-8f0a-e403d226dd44",
  lavanderia: "ecde327e-986a-410c-8ed4-995dd7be90f6",
  vestuario: "05ba8714-0f53-40fd-9e7c-bafaec6d72e8",
  calcados: "3ea9755c-be81-4900-be76-102a1e314481",
  acessorios: "d830a22d-8a0c-47e3-80c4-dafa60336bc7",
  perfumaria: "46fa924e-1a86-43b3-9b62-59bcdff521bd",

  restaurante: "ae2cfb54-bb2b-41ee-b565-2e955f68211d",
  happyHour: "95b29d89-08fe-49c3-bba5-43b871a015bf",
  cinema: "351f205b-8306-427a-9d08-475d215301e8",
  show: "54c7d964-2b87-4606-856d-e1dc5c854374",
  outrosLazer: "16a0ab4a-494d-458d-b021-f6f2c86c545d",

  seguroVeiculo: "67c355a5-b1b0-4487-9f38-d5ffd9384095",
  manutencaoVeiculo: "78ff507e-9c4b-42df-9a4f-1eb7a77321c5",

  papelaria: "542de1a1-1f3a-428a-8015-4ec0147f1ffd",

  assinaturas: "efa00a7f-f7ee-4c4b-bd83-2d2160821633",
  loterica: "12ec274e-43f6-4369-b837-1c983d7d6bf3",
  investimento: "a22ae53b-69a9-4c88-a80c-88f9a50b2148",
};

const rules = [
  { terms: ["supermercado", "sonda", "zaffari", "pão de açúcar", "pao de acucar"], category: C.mercado },
  { terms: ["hortifruti"], category: C.hortifruti },
  { terms: ["padaria", "bella paulista", "galeria dos pães", "delicia de perdizes"], category: C.padaria },
  { terms: ["doces", "doceria", "bolo", "bolos", "mamadi"], category: C.doceria },
  { terms: ["emporio", "empório"], category: C.emporio },
  { terms: ["sorvete", "gelato", "heladeria", "cafes", "café", "barista", "rei do mate"], category: C.cafesSorvete },
  { terms: ["uber eats", "food to save"], category: C.delivery },

  { terms: ["uber", "taxi", "táxi"], category: C.uberTaxi },
  { terms: ["estacionamento"], category: C.estacionamento },
  { terms: ["zona azul"], category: C.zonaAzul },
  { terms: ["ônibus", "onibus", "metrô", "metro", "condução"], category: C.conducao },
  { terms: ["combustível", "combustivel", "posto"], category: C.combustivel },

  { terms: ["farmácia", "farmacia", "medicamentos", "drogasil", "raia", "granado"], category: C.farmacia },
  { terms: ["dentista"], category: C.dentista },
  { terms: ["exame"], category: C.exame },
  { terms: ["convênio", "convenio", "plano de saúde", "plano de saude"], category: C.convenio },

  { terms: ["conta telefone"], category: C.internetTelefone },
  { terms: ["água", "agua", "sabesp"], category: C.agua },
  { terms: ["luz", "enel"], category: C.luz },
  { terms: ["floricultura"], category: C.floricultura },
  { terms: ["leroy merlin", "camicado", "vidraçaria", "utensílios"], category: C.manutencaoCasa },
  { terms: ["gás", "gas"], category: C.gas },

  { terms: ["lavanderia"], category: C.lavanderia },
  { terms: ["salão", "salao", "cabeleireiro", "manicure", "higiene pessoal"], category: C.salao },
  { terms: ["boticário", "boticario"], category: C.perfumaria },
  { terms: ["vestuário", "vestuario", "lupo", "insider", "zinzane"], category: C.vestuario },
  { terms: ["calçados", "calcados"], category: C.calcados },
  { terms: ["acessórios", "acessorios", "capinha"], category: C.acessorios },

  { terms: ["restaurante", "jantar", "almoço", "almoco", "sushi", "pizza", "lanches", "esfiha", "ponto chic", "shokiti"], category: C.restaurante },
  { terms: ["happy hour", "come here"], category: C.happyHour },
  { terms: ["cinema", "cinepolis", "cinépolis"], category: C.cinema },
  { terms: ["show"], category: C.show },
  { terms: ["exposição", "exposicao", "jogos", "circo"], category: C.outrosLazer },

  { terms: ["seguro do carro", "seguro etios"], category: C.seguroVeiculo },
  { terms: ["centro automotivo"], category: C.manutencaoVeiculo },

  { terms: ["papelaria", "kalunga", "material de escritório"], category: C.papelaria },

  { terms: ["spotify", "claude", "capcut", "seats.aero", "livelo", "hailuoai", "clube livelo"], category: C.assinaturas },
  { terms: ["loteria", "bolão mega"], category: C.loterica },
  { terms: ["wise", "okx", "xp"], category: C.investimento },
];

async function applyRule(
  prisma: PrismaClient,
  rule: {
    terms: string[];
    category: string;
  },
) {
  let total = 0;

  for (const term of rule.terms) {
    const result = await prisma.transaction.updateMany({
      where: {
        type: "EXPENSE",
        description: {
          contains: term,
          mode: "insensitive",
        },
      },
      data: {
        categoryId: rule.category,
      },
    });

    total += result.count;
  }

  return total;
}

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter } as never);

  let totalUpdated = 0;

  for (const rule of rules) {
    const count = await applyRule(prisma, rule);
    totalUpdated += count;
  }

  const fallback = await prisma.transaction.updateMany({
    where: {
      type: "EXPENSE",
      categoryId: null,
    },
    data: {
      categoryId: C.outrasDespesas,
    },
  });

  console.log(`Atualizadas por regras: ${totalUpdated}`);
  console.log(`Enviadas para Outras despesas: ${fallback.count}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
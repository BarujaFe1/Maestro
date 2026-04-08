````markdown
<!-- =========================================================
  MAESTRO README
========================================================= -->

<p align="center">
  <pre>
███╗   ███╗ █████╗ ███████╗███████╗████████╗██████╗  ██████╗ 
████╗ ████║██╔══██╗██╔════╝██╔════╝╚══██╔══╝██╔══██╗██╔═══██╗
██╔████╔██║███████║█████╗  ███████╗   ██║   ██████╔╝██║   ██║
██║╚██╔╝██║██╔══██║██╔══╝  ╚════██║   ██║   ██╔══██╗██║   ██║
██║ ╚═╝ ██║██║  ██║███████╗███████║   ██║   ██║  ██║╚██████╔╝
╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝ 

App mobile para gestão pedagógica musical do GEM de Vargem Grande do Sul
  </pre>
</p>

<h1 align="center">Maestro</h1>

<p align="center">
  <a href="https://github.com/BarujaFe1/Maestro">
    <img src="https://img.shields.io/badge/repo-GitHub-181717?style=for-the-badge&logo=github" alt="GitHub Repository" />
  </a>
  <img src="https://img.shields.io/badge/React%20Native-0.81.5-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React Native 0.81.5" />
  <img src="https://img.shields.io/badge/React-19.1.0-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 19.1.0" />
  <img src="https://img.shields.io/badge/Expo-54-000020?style=for-the-badge&logo=expo&logoColor=white" alt="Expo 54" />
  <img src="https://img.shields.io/badge/Supabase-JS%202.98-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase JS 2.98" />
  <img src="https://img.shields.io/badge/Platform-Android-3DDC84?style=for-the-badge&logo=android&logoColor=white" alt="Android" />
  <img src="https://img.shields.io/badge/Status-Beta%20interno-2563EB?style=for-the-badge" alt="Status Beta interno" />
  <img src="https://img.shields.io/badge/License-MIT-111827?style=for-the-badge" alt="MIT License" />
</p>

<p align="center">
  Um aplicativo mobile para registrar aulas, acompanhar evolução musical e gerar relatórios pedagógicos do GEM em um fluxo compartilhado com Supabase.
</p>

---

## 1. Sobre o projeto

O **Maestro** é um aplicativo mobile criado para digitalizar a operação pedagógica do **GEM (Grupo de Estudo Musical de Vargem Grande do Sul)**.

Na prática, ele substitui cadernos, fichas soltas e planilhas fragmentadas por um fluxo centralizado para:

- cadastrar alunos e professores;
- registrar aulas com granularidade musical real;
- acompanhar evolução individual e coletiva;
- visualizar sinais pedagógicos com gráficos e indicadores;
- exportar relatórios e backups para uso interno da equipe.

### Qual problema ele resolve

Antes do Maestro, o acompanhamento pedagógico dependia de registros manuais, memória da equipe e consolidação manual de informações. Isso dificultava:

- saber o que cada aluno estudou de fato;
- comparar evolução ao longo do tempo;
- identificar estagnação, aceleração ou queda de desempenho;
- consolidar relatórios por instrumento, grupo ou período;
- compartilhar a operação entre encarregados e instrutores.

### Para quem foi feito

O app foi pensado para uso real por:

- **instrutores** que lançam aulas no dia a dia;
- **encarregados locais e regionais** que acompanham alunos e equipes;
- **coordenação pedagógica** que precisa de relatórios e visão consolidada.

### Por que ele existe

O Maestro existe para que a operação do GEM seja tratada como um sistema pedagógico contínuo, e não como uma coleção de anotações isoladas.

---

## 2. Funcionalidades

### 👥 Alunos
- cadastro completo de alunos;
- edição, filtros e exclusão;
- campos pedagógicos e administrativos no mesmo fluxo;
- organização por instrumento, família, nível, graduação, congregação e status;
- histórico individual conectado aos registros de aula.

### 🎼 Aulas
- registro detalhado de aulas individuais e teóricas;
- seleção de professor e método;
- conteúdo musical estruturado;
- páginas, itens de lição, hinos, vozes e solfejo;
- observações pedagógicas;
- presença vinculada ao lançamento;
- habilidades avaliadas de forma estruturada.

### 📈 Analytics
- KPIs individuais por aluno;
- evolução mensal;
- score médio;
- delta de progresso;
- radar de habilidades;
- alertas de estagnação, aceleração e declínio;
- visão coletiva do grupo por período.

### 📊 Relatórios
- ranking de alunos;
- média por instrumento;
- distribuição por nível;
- crescimento do grupo;
- alertas de alunos sem registro recente;
- exportação em PDF, Excel, PNG e JSON.

### 🧑‍🏫 Professores e equipe
- cadastro de professores/encarregados;
- papéis como Instrutor, Encarregado Local e Encarregado Regional;
- uso compartilhado via organização no Supabase;
- entrada automática em equipe por código.

### 🧰 Métodos
- cadastro e gerenciamento de métodos;
- vínculo com instrumentos;
- catálogo musical embutido em JSON;
- suporte a métodos oficiais usados no contexto do GEM.

### ⚙️ Configuração e operação
- autenticação com e-mail/senha;
- modo convidado;
- tema claro/escuro com persistência;
- logs locais exportáveis;
- ErrorBoundary global;
- contexto operacional compartilhado entre telas.

### 🗂️ Telas complementares
- Presença
- Metas
- Grupos
- Central de Aulas
- Tela Principal (Shell)
- Grupos de Teoria
- Tela de Hoje

---

## 3. Stack tecnológica

| Tecnologia | Versão | Uso no projeto |
|---|---:|---|
| React Native | 0.81.5 | Base do app mobile |
| React | 19.1.0 | Camada de interface e estado |
| Expo | 54 | Tooling, runtime e integração nativa |
| React Navigation | compatível com Expo 54 | Navegação principal via Drawer + Native Stack |
| Supabase JS | 2.98 | Autenticação, banco de dados e RPC |
| AsyncStorage | n/a | Persistência local de tema e estados auxiliares |
| Day.js | n/a | Manipulação e formatação de datas |
| React Native Chart Kit | n/a | Gráficos de evolução e analytics |
| React Native SVG | n/a | Base gráfica para charts |
| Expo Print | n/a | Geração de PDF |
| Expo Sharing | n/a | Compartilhamento de arquivos gerados |
| Expo File System | n/a | Escrita e leitura de arquivos exportados |
| React Native View Shot | n/a | Captura de gráficos como imagem |
| XLSX | n/a | Exportação para planilha `.xlsx` |
| Gradle / Android nativo | conforme SDK local | Geração de APK release local |
| EAS Build | perfis configurados | Build remoto para APK interno e App Bundle |

---

## 4. Arquitetura

### Visão geral

O projeto está organizado para separar claramente:

- interface reutilizável;
- contexto global;
- catálogo e dados estáticos;
- serviços de acesso a dados;
- regras utilitárias;
- telas de fluxo;
- integrações nativas / build.

### Estrutura em alto nível

```text
src/
├── components/
├── constants/
├── context/
├── data/
├── lib/
├── navigation/
├── screens/
├── services/
├── theme/
└── utils/

supabase/
└── migrations/

docs/
└── setup e documentação complementar
````

### Estrutura em ASCII com comentários

```text
src/
├── components/         # Componentes reutilizáveis de UI e blocos visuais
│   ├── AppUI           # primitives e wrappers visuais
│   ├── BottomNavBar    # navegação operacional inferior
│   ├── BulkEntryField  # entrada em lote de itens/páginas/lições
│   ├── CollapsibleSection
│   ├── DrawerMenuButton
│   ├── ErrorBoundary
│   ├── KpiCard
│   ├── LessonTypeTabs
│   ├── MultiSelectModal
│   ├── RadarChart
│   ├── ScoreInputRow
│   ├── SelectModal
│   └── UnitSwitcher
│
├── constants/          # enums e constantes de domínio
│   ├── lessonTypes.js
│   └── units.js
│
├── context/            # contexto global da aplicação
│   ├── AuthContext.js
│   └── OperationalContext.js
│
├── data/               # catálogos locais e métodos embutidos
│   ├── catalogs.js
│   └── methodCatalog/  # JSONs por instrumento/método
│
├── lib/                # clientes e integrações centrais
│   └── supabase.js
│
├── navigation/         # configuração de navegação
│   └── AppNavigator.js
│
├── screens/            # telas da aplicação
│   ├── AttendanceScreen.js
│   ├── DashboardScreen.js
│   ├── LessonCenterScreen.js
│   ├── LoginScreen.js
│   ├── LogsScreen.js
│   ├── MainShellScreen.js
│   ├── MethodsScreen.js
│   ├── ReportsScreen.js
│   ├── SettingsScreen.js
│   ├── StudentDetailScreen.js
│   ├── StudentsScreen.js
│   ├── TeachersScreen.js
│   ├── TodayScreen.js
│   ├── TheoryGroupsScreen.js
│   └── demais telas auxiliares
│
├── services/           # acesso a dados e regras orientadas a CRUD/consultas
│   ├── db.js
│   └── org.js
│
├── theme/              # tokens visuais e tema persistido
│   └── ThemeProvider.js
│
└── utils/              # funções de apoio, analytics e normalização
    ├── analytics.js
    ├── attendanceStore.js
    ├── bulkInputParser.js
    ├── calendarRules.js
    ├── errorHandler.js
    ├── exporters.js
    ├── lessonAdapters.js
    ├── lessonPayload.js
    ├── logger.js
    ├── methodCatalog.js
    ├── normalizers.js
    ├── pedagogy.js
    ├── reportInsights.js
    ├── reporting.js
    └── theoryGroupsStore.js
```

### Papel de cada camada

| Camada        | Responsabilidade                                                 |
| ------------- | ---------------------------------------------------------------- |
| `components/` | Reuso de interface e blocos visuais                              |
| `constants/`  | Regras estáticas de tipo de aula e unidades                      |
| `context/`    | Estado global de autenticação e operação                         |
| `data/`       | Catálogo embutido de instrumentos, métodos e estruturas musicais |
| `lib/`        | Clientes externos, principalmente Supabase                       |
| `navigation/` | Contrato de navegação da aplicação                               |
| `screens/`    | Fluxos completos orientados a usuário                            |
| `services/`   | CRUD, relatórios e consultas ao Supabase                         |
| `theme/`      | Tema claro/escuro e tokens visuais                               |
| `utils/`      | Regras de analytics, parsing, exportação e normalização          |

---

## 5. Banco de dados

### Visão simplificada das entidades principais

```text
organizations
    └──< profiles
            └──< students
            └──< teachers
            └──< methods
            └──< lessonrecords

students
    └──< lessonrecords >── teachers
                     └──> methods
```

### Relacionamentos principais

* uma **organization** agrupa perfis, alunos, professores e registros;
* um **profile** representa o usuário autenticado;
* um **student** pode ter vários registros em `lessonrecords`;
* um **teacher** pode lançar várias aulas;
* um **method** pode ser associado a vários registros de aula;
* `joinOrgByCode` conecta o usuário a uma organização compartilhada.

### Tabelas principais

#### `profiles`

Campos centrais:

* `id`
* `fullname`
* `role`
* `orgid`

Uso:

* identifica o usuário autenticado;
* define papel dentro da organização;
* ancora o escopo coletivo da equipe.

#### `organizations`

Campos centrais:

* `id`
* `name`
* `joincode`

Uso:

* representa a equipe/organização compartilhada;
* controla a entrada por código.

#### `students`

Campos centrais:

* `id`
* `fullname`
* `instrument`
* `family`
* `level`
* `graduation`
* `congregation`
* `status`
* `startdate`
* `observations`
* `address`
* `phone`
* `birthdate`
* `baptismdate`
* `instrumentchangenote`
* `ownerid`

Uso:

* ficha pedagógica e administrativa do aluno.

#### `teachers`

Campos centrais:

* `id`
* `fullname`
* `instrument`
* `congregation`
* `rolekind`
* `active`

Uso:

* cadastro de instrutores e encarregados.

#### `methods`

Campos centrais:

* `id`
* `name`
* `instruments`
* `active`
* `notes`

Uso:

* gerenciar métodos do banco e integrar com o catálogo embutido.

#### `lessonrecords`

Campos centrais:

* `id`
* `studentid`
* `teacherid`
* `methodid`
* `lessondate`
* `contentgroup`
* `contentnumber`
* `voices`
* `solfejo`
* `observations`
* `contentitems[]`
* `pageitems[]`
* `lessonitems[]`
* `skillrhythm`
* `skillreading`
* `skilltechnique`
* `skillposture`
* `skillmusicality`
* `attendance`
* `launchedat`

Uso:

* núcleo do acompanhamento pedagógico;
* armazena o que foi trabalhado em aula e como foi avaliado.

### RPCs

#### `joinOrgByCode`

Responsável por vincular um usuário autenticado a uma organização/equipe a partir de um código.

---

## 6. Como rodar localmente

### Pré-requisitos

Instale e configure:

* **Node.js** 20+ recomendado
* **npm** ou **pnpm** (os exemplos abaixo usam npm)
* **Expo CLI via npx**
* **Android Studio** com Android SDK
* **Java 17**
* **ADB** configurado no PATH
* projeto Supabase configurado
* um dispositivo Android com Expo Go **ou** emulador Android

### Clonar o repositório

```bash
git clone https://github.com/BarujaFe1/Maestro.git
cd Maestro
```

### Instalar dependências

```bash
npm install
```

### Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
EXPO_PUBLIC_ORG_JOIN_CODE=CODIGO_DA_EQUIPE
```

### Rodar no Expo

Modo local padrão:

```bash
npx expo start
```

Modo com túnel, útil quando o dispositivo não está na mesma rede:

```bash
npx expo start --tunnel
```

### Rodar no Android físico com Expo Go

1. Instale o **Expo Go** no celular.
2. Execute:

```bash
npx expo start --tunnel
```

3. Escaneie o QR Code no Expo Go.

### Rodar em emulador Android

Com o emulador já aberto:

```bash
npx expo start
```

Depois pressione `a` no terminal do Expo.

### Dica para ADB físico

Para builds nativas ou comunicação local, confirme se o aparelho está visível:

```bash
adb devices
```

Se necessário, instale uma build manualmente depois:

```bash
adb install -r caminho/para/o/apk/app-release.apk
```

---

## 7. Build Android

### Requisitos

* Java 17
* Android Studio
* Android SDK
* variáveis de ambiente do Android corretamente configuradas
* pasta `android/` presente no projeto
* Gradle funcional

### Variáveis de ambiente comuns no Windows

Exemplo de configuração esperada:

```powershell
$env:JAVA_HOME="C:\Program Files\Java\jdk-17"
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
$env:Path += ";$env:ANDROID_HOME\platform-tools"
$env:Path += ";$env:ANDROID_HOME\emulator"
$env:Path += ";$env:ANDROID_HOME\cmdline-tools\latest\bin"
```

### Gerar APK release local via Gradle

Entre na pasta Android e execute:

```bash
cd android
.\gradlew.bat assembleRelease
```

### Onde o APK é gerado

```text
android/app/build/outputs/apk/release/app-release.apk
```

### Instalar via ADB

```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

### Perfis EAS configurados

O projeto também prevê uso de EAS com perfis:

* `development`
* `preview` → APK interno
* `production` → App Bundle

Exemplo:

```bash
eas build --platform android --profile preview
```

---

## 8. Configuração do Supabase

### O que precisa estar configurado

* projeto Supabase criado;
* autenticação habilitada;
* tabelas principais criadas;
* migrations aplicadas;
* RPC `joinOrgByCode` disponível;
* organização inicial criada;
* código de equipe definido.

### Aplicando migrations

As migrations ficam em:

```text
supabase/
```

Você pode aplicar pelo Supabase CLI ou rodar os SQLs diretamente no painel, dependendo do fluxo adotado no projeto.

### Organização/equipe

O app usa organização compartilhada com entrada por código.

Fluxo esperado:

1. criar a organização em `organizations`;
2. definir um `joincode`;
3. configurar `EXPO_PUBLIC_ORG_JOIN_CODE` quando fizer sentido;
4. permitir que os usuários entrem automaticamente na equipe via RPC `joinOrgByCode`.

### Autenticação

O Maestro suporta:

* e-mail/senha;
* modo convidado anônimo;
* autoentrada na organização por código.

---

## 9. Estrutura de pastas

### Árvore comentada

```text
.
├── android/                    # projeto Android nativo gerado pelo Expo
├── docs/                       # documentação auxiliar de setup/configuração
├── supabase/                   # migrations SQL e material de banco
├── src/
│   ├── components/             # componentes reutilizáveis da UI
│   ├── constants/              # enums e constantes de domínio
│   ├── context/                # providers globais (auth e operação)
│   ├── data/                   # catálogos locais e JSONs de métodos
│   ├── lib/                    # cliente Supabase
│   ├── navigation/             # configuração de rotas e navegação
│   ├── screens/                # telas do app
│   ├── services/               # acesso ao Supabase e consultas
│   ├── theme/                  # tema claro/escuro
│   └── utils/                  # analytics, exportação, parsing, normalização
├── .env.example                # opcionalmente recomendado
├── app.json                    # configuração do Expo
├── eas.json                    # perfis de build EAS
├── package.json                # scripts e dependências
└── README.md                   # documentação principal
```

### Arquivos particularmente relevantes

| Arquivo                             | Papel                                 |
| ----------------------------------- | ------------------------------------- |
| `src/navigation/AppNavigator.js`    | Contrato principal de navegação       |
| `src/context/AuthContext.js`        | Sessão, login e fluxo de autenticação |
| `src/context/OperationalContext.js` | Estado operacional compartilhado      |
| `src/services/db.js`                | CRUD e consultas de banco/relatórios  |
| `src/lib/supabase.js`               | Cliente Supabase configurado          |
| `src/utils/analytics.js`            | KPIs e cálculos de evolução           |
| `src/utils/exporters.js`            | PDF, Excel, PNG e JSON                |
| `src/data/catalogs.js`              | Catálogos locais principais           |
| `src/data/methodCatalog/`           | Métodos musicais embutidos em JSON    |
| `src/theme/ThemeProvider.js`        | Tema claro/escuro com persistência    |

---

## 10. Decisões técnicas

### Por que Expo com pasta nativa?

Porque o projeto precisava do ciclo rápido do Expo, mas também precisava manter uma saída Android nativa previsível para build local via Gradle.

Essa combinação dá:

* iteração rápida no desenvolvimento;
* acesso ao ecossistema Expo;
* capacidade de gerar APK local quando necessário.

### Por que Supabase?

Porque o projeto precisava de:

* autenticação;
* banco relacional;
* RPC;
* uso compartilhado por equipe;
* integração simples com JavaScript/TypeScript.

O Supabase atende bem esse cenário sem exigir backend customizado logo no início.

### Por que analytics dentro do app?

Porque o uso é operacional e pedagógico, e boa parte das decisões precisa estar disponível no próprio dispositivo durante aula, acompanhamento e reuniões de equipe.

Isso evita depender sempre de um dashboard externo.

### Por que exportação local?

Porque a equipe precisa:

* gerar PDF;
* compartilhar planilhas;
* capturar gráficos;
* criar backups;
* operar mesmo com fluxo mais local e prático.

Exportação local reduz atrito para uso interno.

### Por que organização por código?

Porque o contexto do GEM exige entrada simples em equipe compartilhada, sem fluxo complexo de administração de usuários.

O código da organização reduz atrito de onboarding e mantém a operação centralizada.

---

## 11. Roadmap

### ✅ Implementado

* autenticação com e-mail/senha
* modo convidado
* entrada automática em organização por código
* cadastro completo de alunos
* cadastro de professores/encarregados
* cadastro e gestão de métodos
* registro detalhado de aulas
* analytics individuais
* analytics coletivos
* exportação em PDF, Excel, PNG e JSON
* logs locais exportáveis
* tema claro/escuro persistido
* catálogo de métodos em JSON
* navegação principal com Drawer + Native Stack
* ErrorBoundary global

### 🔄 Em desenvolvimento

* refinamentos contínuos de UX operacional
* fluxo de grupos teóricos e presença por grupo
* ajustes incrementais de performance em listas grandes
* evolução da modelagem pedagógica de metas e grupos

### 📋 Planejado

* consolidação adicional de metas pedagógicas
* refinamento de relatórios por grupo/equipe
* melhorias de build e distribuição interna
* expansão da camada de catálogos musicais
* maior cobertura de métricas pedagógicas

---

## 12. Como contribuir

### Padrão de commits

Use **Conventional Commits**:

```text
feat: adiciona exportação de relatório por instrumento
fix: corrige cálculo de delta de progresso
refactor: simplifica normalização de lessonrecords
docs: atualiza instruções de build Android
```

### Fluxo recomendado

1. Crie uma branch:

```bash
git checkout -b feat/nome-da-feature
```

2. Faça as alterações necessárias.

3. Rode os testes e validações que existirem no projeto.

4. Abra um Pull Request com:

* contexto do problema;
* escopo da mudança;
* prints ou GIFs quando houver UI;
* observações de banco/migration, se houver.

### Como reportar bug

Ao abrir uma issue ou reportar internamente, inclua:

* tela afetada;
* comportamento esperado;
* comportamento atual;
* passos para reproduzir;
* log do terminal;
* log exportado do app, se aplicável;
* versão do Android/dispositivo.

---

## 13. Licença

Este projeto está licenciado sob a licença **MIT**.

Consulte o arquivo `LICENSE` para os detalhes.

---

## 14. Observações finais

O Maestro não é um app genérico de escola. Ele foi modelado para o contexto específico do **GEM de Vargem Grande do Sul**, com foco em:

* ensino musical coletivo;
* acompanhamento pedagógico contínuo;
* operação compartilhada entre equipe;
* relatórios úteis para decisão real.

Se você pretende adaptar o projeto para outro contexto, vale começar por:

* catálogos musicais;
* papéis de equipe;
* organização do banco;
* regras pedagógicas e métricas.

```
```

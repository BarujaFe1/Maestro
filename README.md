<div align="center">
  <img src="./assets/icon.png" alt="Maestro Logo" width="120" height="120" />

  # Maestro

  **Organização e acompanhamento musical para o Grupo de Estudos Musicais**

  <p>
    <a href="#-sobre-o-projeto">Sobre</a> •
    <a href="#-funcionalidades">Funcionalidades</a> •
    <a href="#-tecnologias">Tecnologias</a> •
    <a href="#-estrutura-do-projeto">Estrutura</a> •
    <a href="#-como-executar">Como executar</a> •
    <a href="#-build-android">Build Android</a> •
    <a href="#-downloads">Downloads</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/version-1.0.1-blue.svg" alt="Version 1.0.1" />
    <img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License MIT" />
    <img src="https://img.shields.io/badge/Expo-54.0.33-000020.svg?logo=expo" alt="Expo 54.0.33" />
    <img src="https://img.shields.io/badge/React-19.1.0-61DAFB.svg?logo=react" alt="React 19.1.0" />
    <img src="https://img.shields.io/badge/React%20Native-0.81.5-61DAFB.svg?logo=react" alt="React Native 0.81.5" />
    <img src="https://img.shields.io/badge/Supabase-2.98.0-3ECF8E.svg?logo=supabase" alt="Supabase 2.98.0" />
  </p>
</div>

---

## 📖 Sobre o projeto

**Maestro** é um aplicativo mobile desenvolvido para apoiar o acompanhamento musical coletivo do Grupo de Estudos Musicais.  
O app centraliza alunos, professores, métodos, lançamentos de aula, relatórios, exportações e visão analítica de evolução em um só lugar.

A proposta é simples: reduzir burocracia, padronizar o trabalho dos instrutores e manter tudo compartilhado em um ambiente colaborativo.

### Objetivos do app

- Organizar o acompanhamento musical de forma coletiva.
- Registrar aulas e progresso com rapidez.
- Facilitar análise por aluno, método e grupo.
- Permitir exportação de relatórios e backups.
- Manter autenticação e dados centralizados com Supabase.

---

## ✨ Funcionalidades

### 🔐 Autenticação e acesso
- Login com e-mail e senha via Supabase.
- Cadastro de conta.
- Entrada anônima/convidado quando habilitada.
- Perfil do usuário com atualização de nome.
- Autoentrada opcional em organização via código.

### 👥 Gestão de alunos
- Cadastro completo de alunos.
- Instrumento, família, graduação, congregação e observações.
- Busca e organização por filtros.
- Tela individual com histórico e indicadores.

### 🧑‍🏫 Professores e métodos
- Cadastro de professores e encarregados.
- Cadastro de métodos musicais.
- Associação de métodos por instrumento.
- Organização do ensino por compatibilidade.

### 📝 Lançamentos de aula
- Registro de aula com data.
- Seleção de aluno, professor e método.
- Suporte a múltiplos hinos/coros.
- Suporte a múltiplas páginas e lições.
- Observações técnicas.
- Controle de presença.

### 📊 Dashboard e relatórios
- Visão geral do grupo.
- Indicadores de alunos, registros e média.
- Gráficos de crescimento e distribuição.
- Ranking e alertas de acompanhamento.
- Relatórios coletivos com filtros por período.

### 📤 Exportações
- Exportação em PDF.
- Exportação em Excel.
- Exportação de gráfico em imagem.
- Backup em JSON.

### ⚙️ Configurações e suporte
- Tema claro, escuro ou automático.
- Informações da equipe/organização.
- Entrada em organização por código.
- Tela de logs para suporte e diagnóstico.

---

## 🧰 Tecnologias

### App
- [Expo](https://expo.dev/)
- [React](https://react.dev/)
- [React Native](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [React Native Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)
- [React Native Screens](https://github.com/software-mansion/react-native-screens)
- [React Native Safe Area Context](https://github.com/AppAndFlow/react-native-safe-area-context)

### Backend e dados
- [Supabase](https://supabase.com/)
- RPC para entrada em organização
- SQL versionado na pasta `supabase/`

### Relatórios e exportação
- [react-native-chart-kit](https://github.com/indiespirit/react-native-chart-kit)
- [react-native-svg](https://github.com/software-mansion/react-native-svg)
- [react-native-view-shot](https://github.com/gre/react-native-view-shot)
- [expo-print](https://docs.expo.dev/versions/latest/sdk/print/)
- [expo-sharing](https://docs.expo.dev/versions/latest/sdk/sharing/)
- [expo-file-system](https://docs.expo.dev/versions/latest/sdk/filesystem/)
- [xlsx](https://www.npmjs.com/package/xlsx)

---

## 📁 Estrutura do projeto

```text
Maestro/
├── assets/
├── android/
├── docs/
├── src/
│   ├── components/
│   ├── context/
│   ├── data/
│   ├── lib/
│   ├── navigation/
│   ├── screens/
│   ├── services/
│   ├── theme/
│   └── utils/
├── supabase/
├── App.js
├── app.json
├── babel.config.js
├── eas.json
├── package.json
└── README.md
```

### Arquivos importantes

- `src/context/AuthContext.js` — autenticação, sessão e perfil.
- `src/lib/supabase.js` — cliente Supabase.
- `src/navigation/AppNavigator.js` — navegação principal.
- `src/screens/ReportsScreen.js` — relatórios e exportações.
- `src/screens/SettingsScreen.js` — configurações, organização e backup.
- `src/utils/exporters.js` — PDF, Excel, imagem e JSON.
- `android/` — configuração nativa Android.

---

## ⚙️ Como executar

### Pré-requisitos

- Node.js LTS
- npm
- Android Studio ou dispositivo Android
- Conta Expo
- Projeto Supabase configurado

### 1. Clone o repositório

```bash
git clone https://github.com/BarujaFe1/Maestro.git
cd Maestro
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o ambiente

Crie um arquivo `.env` na raiz:

```env
EXPO_PUBLIC_SUPABASE_URL=sua_url_do_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
EXPO_PUBLIC_ORG_JOIN_CODE=GEMVGS-2026
```

> Dica: mantenha um `.env.example` sem segredos reais para facilitar setup da equipe.

### 4. Execute em desenvolvimento

```bash
npx expo start -c
```

Depois:
- pressione `a` para abrir no Android;
- ou escaneie o QR Code com o Expo Go.

---

## 🗄️ Supabase

O projeto usa Supabase para:
- autenticação;
- persistência de sessão;
- perfil do usuário;
- organização/equipe;
- regras de acesso por organização;
- RPC de entrada por código.

### Variáveis esperadas

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_ORG_JOIN_CODE=
```

### SQL do projeto

A pasta `supabase/` contém scripts SQL e evolução de schema usados no Maestro.

---

## 🤝 Uso coletivo

O Maestro foi pensado para uso compartilhado entre instrutores.  
Quando configurado, o usuário pode entrar automaticamente em uma organização usando um código como:

```text
GEMVGS-2026
```

Isso permite que os dados fiquem centralizados para toda a equipe, respeitando a separação por organização.

---

## 📱 Build Android

O projeto usa **EAS Build** para gerar builds Android.  
Como o app já possui pasta `android/`, ele funciona tanto no fluxo Expo quanto com configuração nativa versionada.

### Instalar EAS CLI

```bash
npm install -g eas-cli
```

### Login

```bash
eas login
```

### Build de teste em APK

```bash
eas build --platform android --profile preview
```

### Build de produção

```bash
eas build --platform android --profile production
```

### Variáveis no EAS

Garanta que estas variáveis estejam configuradas no EAS:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_ORG_JOIN_CODE`

---

## 📥 Downloads

### APK atual
- **Baixar APK:** [COLOQUE_AQUI_O_LINK_DO_APK](COLOQUE_AQUI_O_LINK_DO_APK)

### Releases
- **Página de releases:** [https://github.com/BarujaFe1/Maestro/releases](https://github.com/BarujaFe1/Maestro/releases)

### Como publicar um novo APK
1. Gere o build com EAS.
2. Baixe o APK gerado.
3. Crie uma nova Release no GitHub.
4. Anexe o arquivo `.apk`.
5. Atualize o link acima, se quiser apontar direto para a versão mais recente.

---

## 🧪 Troubleshooting

### O app funciona no Expo Go, mas fecha no APK
Verifique:
- variáveis `EXPO_PUBLIC_*` no EAS;
- profile correto no `eas.json`;
- dependências de exportação e módulos carregados em release;
- logs Android com `adb logcat`.

### Problemas comuns
- `.env` local funcionando, mas build remoto sem variáveis.
- Configuração ausente no Supabase.
- Código de organização incorreto.
- Dependência pesada quebrando em release.

---

## 📄 Documentação auxiliar

Consulte também:
- `docs/COLLAB_SETUP.md`
- `docs/NO_EMAIL_CONFIRM.md`

---

## 🤝 Contribuição

Contribuições são bem-vindas.

1. Faça um fork do projeto.
2. Crie uma branch:
   ```bash
   git checkout -b feature/minha-melhoria
   ```
3. Commit suas mudanças:
   ```bash
   git commit -m "feat: minha melhoria"
   ```
4. Envie para o seu fork:
   ```bash
   git push origin feature/minha-melhoria
   ```
5. Abra um Pull Request.

---

## 📄 Licença

Distribuído sob a licença MIT.  
Veja o arquivo `LICENSE` para mais informações.

---

## 👨‍💻 Autor

Desenvolvido por **BarujaFe**.

<p align="center">
  <i>Projeto criado para apoiar a organização e o acompanhamento musical coletivo.</i>
</p>

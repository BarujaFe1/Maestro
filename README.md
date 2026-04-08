# Maestro - fix de navegação e safe area

Este pacote corrige dois problemas pontuais:

1. A navegação para `GruposTeoricos` agora aponta para uma rota realmente registrada no drawer.
2. `MainShellScreen` passa a usar `SafeAreaView` de `react-native-safe-area-context`, removendo o warning de depreciação.

## Arquivos alterados
- `src/navigation/AppNavigator.js`
- `src/screens/LessonCenterScreen.js`
- `src/screens/MainShellScreen.js`

## Como aplicar
Extraia este ZIP na raiz do projeto e sobrescreva os arquivos.
Depois rode:

```bash
npx expo start -c --tunnel
```

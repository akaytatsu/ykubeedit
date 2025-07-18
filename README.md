# YKubeEdit

CLI tool para edição em massa de YAMLs do Kubernetes com foco em automação e padronização.

## 📋 Funcionalidades

- ✅ **Adicionar OpenTelemetry**: Adiciona configurações completas de OpenTelemetry em deployments
- 🔄 **Edição em massa**: Processa múltiplos deployments simultaneamente
- 🎯 **Seleção interativa**: Interface CLI para escolher quais deployments modificar
- 🔍 **Detecção automática**: Escaneia recursivamente buscando deployments Kubernetes
- 💡 **Preview mode**: Visualiza mudanças antes de aplicar (--dry-run)

## 🚀 Instalação e Uso

### Via NPX (Recomendado)

```bash
# Executar diretamente sem instalar
npx ykubeedit add-otel

# Com opções
npx ykubeedit add-otel /path/to/kubernetes/yamls --dry-run
```

### Instalação Global

```bash
npm install -g ykubeedit
ykubeedit add-otel
```

## 📖 Comandos Disponíveis

### `add-otel` - Adicionar OpenTelemetry

Adiciona ou atualiza configurações de OpenTelemetry em deployments Kubernetes.

```bash
# Escanear diretório atual
npx ykubeedit add-otel

# Especificar diretório
npx ykubeedit add-otel /home/usuario/projetos/kubehomol

# Preview sem modificar arquivos
npx ykubeedit add-otel --dry-run

# Ajuda específica do comando
npx ykubeedit add-otel --help
```

#### O que o comando faz:

1. **Escaneia** recursivamente o diretório em busca de arquivos YAML
2. **Identifica** deployments Kubernetes automaticamente
3. **Extrai** informações (namespace, nome do app) de cada deployment
4. **Apresenta** lista interativa para seleção múltipla
5. **Adiciona/Atualiza** as seguintes variáveis de ambiente:

```yaml
env:
  - name: "OTEL_SERVICE_NAME"
    value: "namespace-do-deployment"
  - name: OTEL_RESOURCE_ATTRIBUTES
    value: "cx.application.name=namespace,cx.subsystem.name=namespace-nome-app"
  - name: OTEL_IP
    valueFrom:
      fieldRef:
        fieldPath: status.hostIP
  - name: OTEL_EXPORTER_OTLP_ENDPOINT
    value: http://$(OTEL_IP):4317
  - name: OTEL_PYTHON_DJANGO_INSTRUMENT
    value: "true"
  - name: OTEL_PYTHON_REQUESTS_INSTRUMENT
    value: "true"
  - name: OTEL_PYTHON_PSYCOPG2_INSTRUMENT
    value: "true"
  - name: OTEL_PYTHON_LOGGING_AUTO_INSTRUMENTATION_ENABLED
    value: "true"
```

### Opções Globais

```bash
npx ykubeedit --help              # Ajuda geral
npx ykubeedit --version           # Versão atual
```

## 🎯 Exemplos de Uso

### Cenário 1: Projeto simples

```bash
cd /meu/projeto/kubernetes
npx ykubeedit add-otel
```

### Cenário 2: Preview antes de aplicar

```bash
npx ykubeedit add-otel /home/kubehomol --dry-run
```

### Cenário 3: Múltiplos ambientes

```bash
# Ambiente staging
npx ykubeedit add-otel /kubehomol/sso-stg/backend

# Ambiente homologação  
npx ykubeedit add-otel /kubehomol/fundos-gestora-hml/frontend

# Worker
npx ykubeedit add-otel /kubehomol/fundos-gestora-stg/worker
```

## 🔧 Funcionamento Interno

### Detecção de Deployments

O YKubeEdit procura por arquivos `.yaml` ou `.yml` que contenham:
- `kind: Deployment`
- `apiVersion: apps/v1`

### Extração de Metadados

Para cada deployment encontrado, extrai:
- **namespace**: `metadata.namespace`
- **nome do app**: `metadata.name` 
- **nome do container**: `spec.template.spec.containers[0].name`

### Lógica de Nomenclatura OpenTelemetry

- `OTEL_SERVICE_NAME` = namespace
- `cx.application.name` = namespace  
- `cx.subsystem.name` = namespace + "-" + sufixo baseado no nome do deployment

## 🛠️ Desenvolvimento

### Estrutura do Projeto

```
ykubeedit/
├── package.json
├── README.md
├── bin/
│   └── ykubeedit.js           # Entry point
├── src/
│   ├── cli.js                 # CLI principal
│   ├── commands/
│   │   ├── index.js           # Registry de comandos
│   │   └── add-otel.js        # Comando OpenTelemetry
│   ├── utils/
│   │   ├── file-scanner.js    # Busca arquivos YAML
│   │   ├── yaml-parser.js     # Manipulação YAML
│   │   └── deployment-utils.js # Utilitários K8s
│   └── templates/
│       └── otel-config.js     # Template OTEL
```

### Executar Localmente

```bash
git clone https://github.com/akaytatsu/ykubeedit.git
cd ykubeedit
npm install
npm link
ykubeedit add-otel
```

## 🔮 Roadmap

Futuras funcionalidades planejadas:

- `add-resources` - Configurar CPU/Memory requests/limits
- `add-probes` - Adicionar readiness/liveness probes  
- `update-images` - Atualizar versões de imagens
- `add-secrets` - Configurar secrets e configmaps
- `validate` - Validar sintaxe e boas práticas
- `backup` - Criar backup antes das modificações

## 📄 Licença

MIT

## 🤝 Contribuição

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

- 🐛 Issues: https://github.com/akaytatsu/ykubeedit/issues
- 📧 Email: Abra uma issue no GitHub
# YKubeEdit

CLI tool para edição em massa de YAMLs do Kubernetes com foco em automação e padronização.

## 📋 Funcionalidades

- ✅ **Adicionar OpenTelemetry**: Adiciona configurações completas de OpenTelemetry em deployments
- 🧹 **Atualizar Cert-Manager**: Corrige cluster-issuer de ingress para homologação (letsencrypt-prod → clusterissue)
- 🔄 **Edição em massa**: Processa múltiplos recursos Kubernetes simultaneamente
- 🎯 **Seleção interativa**: Interface CLI para escolher quais recursos modificar
- 🔍 **Detecção automática**: Escaneia recursivamente buscando deployments e ingress Kubernetes
- 💡 **Preview mode**: Visualiza mudanças antes de aplicar (--dry-run)
- 📋 **Filtros de exclusão**: Suporte ao arquivo `.yamlsignore` para ignorar pastas/arquivos

## 🚀 Instalação e Uso

### Via NPX (Recomendado)

```bash
# Executar diretamente sem instalar
npx ykubeedit add-otel
npx ykubeedit remove-cert-manager-prod

# Com opções
npx ykubeedit add-otel /path/to/kubernetes/yamls --dry-run
npx ykubeedit remove-cert-manager-prod /path/to/kubernetes/yamls --dry-run
```

### Instalação Global

```bash
npm install -g ykubeedit
ykubeedit add-otel
ykubeedit remove-cert-manager-prod
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

# Selecionar todos automaticamente
npx ykubeedit add-otel --select-all

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

### `remove-cert-manager-prod` - Atualizar Cert-Manager para Homologação

Atualiza a configuração de cert-manager em recursos Ingress para usar o cluster-issuer correto de homologação.

```bash
# Escanear diretório atual
npx ykubeedit remove-cert-manager-prod

# Especificar diretório
npx ykubeedit remove-cert-manager-prod /home/usuario/projetos/kubehomol

# Preview sem modificar arquivos
npx ykubeedit remove-cert-manager-prod --dry-run

# Selecionar todos automaticamente
npx ykubeedit remove-cert-manager-prod --select-all

# Ajuda específica do comando
npx ykubeedit remove-cert-manager-prod --help
```

#### O que o comando faz:

1. **Escaneia** recursivamente o diretório em busca de arquivos YAML
2. **Identifica** recursos Ingress automaticamente
3. **Detecta** ingress que precisam de atualização:
   - Com `cert-manager.io/cluster-issuer: letsencrypt-prod` (substitui por `clusterissue`)
   - Sem nenhuma annotation cert-manager (adiciona `clusterissue`)
4. **Apresenta** lista interativa para seleção múltipla
5. **Atualiza** para usar o cluster-issuer correto de homologação

**Exemplos de mudanças aplicadas:**

```yaml
# CENÁRIO 1: Substituição de letsencrypt-prod
# ANTES
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod  # <- SUBSTITUI
    nginx.ingress.kubernetes.io/rewrite-target: /

# DEPOIS  
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    cert-manager.io/cluster-issuer: clusterissue      # <- ATUALIZADO
    nginx.ingress.kubernetes.io/rewrite-target: /

# CENÁRIO 2: Adição quando não existe
# ANTES
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
    # Sem cert-manager

# DEPOIS
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    cert-manager.io/cluster-issuer: clusterissue      # <- ADICIONADO
    nginx.ingress.kubernetes.io/rewrite-target: /
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

### Cenário 4: Correção de cert-manager para homologação

```bash
# Verificar quais ingress precisam de correção
npx ykubeedit remove-cert-manager-prod /kubehomol/vertc-portal-ri-backend-demo --dry-run

# Corrigir todos os ingress encontrados
npx ykubeedit remove-cert-manager-prod /kubehomol --select-all
```

### Cenário 5: Executando diretamente do repositório

```bash
# Executar diretamente do repositório GitHub sem clonar
npx github:akaytatsu/ykubeedit add-otel
npx github:akaytatsu/ykubeedit remove-cert-manager-prod

# Executar de uma branch específica
npx github:akaytatsu/ykubeedit#main add-otel

# Executar com parâmetros - especificar diretório
npx github:akaytatsu/ykubeedit add-otel /home/usuario/projetos/kubehomol
npx github:akaytatsu/ykubeedit remove-cert-manager-prod /home/usuario/projetos/kubehomol

# Preview sem modificar arquivos
npx github:akaytatsu/ykubeedit add-otel --dry-run
npx github:akaytatsu/ykubeedit remove-cert-manager-prod --dry-run

# Executar versão específica
npx ykubeedit@1.0.0 add-otel

# Executar sempre a versão mais recente
npx ykubeedit@latest add-otel /path/to/yamls
npx ykubeedit@latest remove-cert-manager-prod /path/to/yamls
```

**Vantagens de executar diretamente:**

- ✅ **Sem instalação**: Não precisa instalar globalmente
- ✅ **Sempre atualizado**: Usa a versão mais recente do npm
- ✅ **Não ocupa espaço**: Não fica instalado permanentemente
- ✅ **Rápido**: Execução direta sem setup
- ✅ **Portable**: Funciona em qualquer máquina com npm/node

**Exemplos práticos de uso:**

```bash
# Time de DevOps processando múltiplos ambientes
npx ykubeedit add-otel /projetos/staging --dry-run
npx ykubeedit add-otel /projetos/production
npx ykubeedit remove-cert-manager-prod /projetos/homolog --select-all

# CI/CD Pipeline
npx ykubeedit add-otel $WORKSPACE/k8s --dry-run
npx ykubeedit remove-cert-manager-prod $WORKSPACE/k8s --dry-run

# Developer local
npx ykubeedit add-otel ./kubernetes/manifests
npx ykubeedit remove-cert-manager-prod ./kubernetes/ingress
```

## 🔧 Funcionamento Interno

### Detecção de Recursos Kubernetes

O YKubeEdit procura por arquivos `.yaml` ou `.yml` que contenham:

**Para Deployments:**
- `kind: Deployment`
- `apiVersion: apps/v1`

**Para Ingress:**
- `kind: Ingress`
- `apiVersion: networking.k8s.io/v1`

### Extração de Metadados

**Para Deployments:**
- **namespace**: `metadata.namespace`
- **nome do app**: `metadata.name` 
- **nome do container**: `spec.template.spec.containers[0].name`

**Para Ingress:**
- **namespace**: `metadata.namespace`
- **nome**: `metadata.name`
- **annotations**: `metadata.annotations`

### Lógica de Nomenclatura OpenTelemetry

- `OTEL_SERVICE_NAME` = namespace
- `cx.application.name` = namespace  
- `cx.subsystem.name` = namespace + "-" + sufixo baseado no nome do deployment

### Arquivo .yamlsignore

O YKubeEdit suporta um arquivo `.yamlsignore` na raiz do diretório para excluir pastas/arquivos do processamento.

**Exemplo de `.yamlsignore`:**

```gitignore
# Ignorar pastas específicas
tests/
temp/
backup/

# Ignorar por padrão
*.tmp.yaml
*-backup.yml

# Ambientes específicos
development/
staging-old/

# Arquivos temporários
helm-output/
kustomize-build/
```

**Características:**

- ✅ **Comentários**: Linhas começando com `#` são ignoradas
- ✅ **Paths relativos**: `tests/` ignora a pasta tests do diretório atual
- ✅ **Paths absolutos**: `/home/user/ignore` ignora path específico
- ✅ **Wildcards simples**: `*.tmp.yaml` ignora arquivos temporários
- ✅ **Pastas e arquivos**: Funciona para ambos

**Como funciona:**

1. **Verificação**: YKubeEdit procura por `.yamlsignore` na raiz do diretório
2. **Parsing**: Lê e processa os padrões de exclusão
3. **Aplicação**: Filtra arquivos/pastas durante o scan
4. **Relatório**: Informa quantos arquivos foram ignorados

## 🛠️ Desenvolvimento

### Estrutura do Projeto

```
ykubeedit/
├── package.json
├── README.md
├── bin/
│   └── ykubeedit.js           # Entry point
├── src/
│   ├── cli.js                          # CLI principal
│   ├── commands/
│   │   ├── index.js                    # Registry de comandos
│   │   ├── add-otel.js                 # Comando OpenTelemetry
│   │   └── remove-cert-manager-prod.js # Comando Cert-Manager
│   ├── utils/
│   │   ├── file-scanner.js             # Busca arquivos YAML
│   │   ├── yaml-parser.js              # Manipulação YAML
│   │   └── deployment-utils.js         # Utilitários K8s
│   └── templates/
│       └── otel-config.js              # Template OTEL
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
- `remove-annotations` - Remover annotations específicas de qualquer recurso
- `update-cert-manager` - Atualizar cluster-issuer para ambientes específicos

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
const formulario = document.querySelector("#form-estabelecimento");
const selecaoCategoria = document.querySelector("#categoria");
const camposPorCategoria = {
  Restaurante: document.querySelector("#campos-restaurante"),
  Loja: document.querySelector("#campos-loja"),
  "Espaço de lazer": document.querySelector("#campos-lazer")
};

selecaoCategoria.addEventListener("change", () => {
  Object.entries(camposPorCategoria).forEach(([categoria, secao]) => {
    secao.hidden = selecaoCategoria.value !== categoria;
    secao.querySelectorAll("input, select, textarea").forEach((campo) => {
      campo.disabled = secao.hidden;
    });
  });
});

document.querySelector("#usar-localizacao").addEventListener("click", (evento) => {
  const botao = evento.currentTarget;
  const mensagem = document.querySelector("#mensagem-form");
  if (!navigator.geolocation) {
    mensagem.textContent = "Seu navegador não oferece geolocalização. Informe as coordenadas manualmente.";
    return;
  }
  botao.disabled = true;
  botao.textContent = "Obtendo localização…";
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      document.querySelector("#latitude").value = coords.latitude.toFixed(6);
      document.querySelector("#longitude").value = coords.longitude.toFixed(6);
      mensagem.textContent = "Coordenadas preenchidas com sua localização atual.";
      botao.disabled = false;
      botao.textContent = "◎ Usar minha localização";
    },
    () => {
      mensagem.textContent = "Não foi possível obter sua localização. Confira a permissão do navegador ou informe as coordenadas manualmente.";
      botao.disabled = false;
      botao.textContent = "◎ Usar minha localização";
    },
    { enableHighAccuracy: true, timeout: 12000 }
  );
});

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  const dados = new FormData(formulario);
  const latitude = Number(dados.get("latitude"));
  const longitude = Number(dados.get("longitude"));
  const mensagem = document.querySelector("#mensagem-form");
  if (dados.getAll("fotos").filter((arquivo) => arquivo.name).length > 5) {
    mensagem.textContent = "Selecione no máximo 5 fotos.";
    return;
  }
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    mensagem.textContent = "Confira as coordenadas: latitude deve estar entre -90 e 90 e longitude entre -180 e 180.";
    return;
  }

  const categoria = dados.get("categoria");
  const marcacoes = [...document.querySelectorAll('input[name="recursos"]:checked')].map((campo) => campo.value);
  const recursos = Object.fromEntries([...document.querySelectorAll('input[name="recursos"]')].map((campo) => [campo.value, marcacoes.includes(campo.value)]));
  const acessibilidade = {
    entrada: recursos.entradaAcessivel ? "available" : "unknown",
    banheiro: recursos.banheiroAcessivel ? "available" : "unknown",
    estacionamento: recursos.estacionamentoAcessivel ? "available" : "unknown",
    libras: recursos.libras ? "available" : "unknown",
    tatil: recursos.pisoTatil ? "available" : "unknown",
    braille: recursos.braille ? "available" : "unknown"
  };
  const local = {
    id: `cadastro-${Date.now()}`,
    nome: dados.get("nome").trim(),
    categoria,
    endereco: dados.get("endereco").trim(),
    telefone: dados.get("telefone").trim(),
    email: dados.get("email").trim(),
    horario: dados.get("horario").trim(),
    latitude,
    longitude,
    acessibilidade,
    ...recursos,
    detalhes: Object.fromEntries([...dados.entries()].filter(([chave, valor]) => valor && !["nome", "categoria", "endereco", "latitude", "longitude", "telefone", "email", "horario", "recursos", "fotos"].includes(chave))),
    fotos: [...(dados.getAll("fotos") || [])].filter((arquivo) => arquivo.name).map((arquivo) => arquivo.name)
  };

  try {
    const locais = JSON.parse(localStorage.getItem("incluimais-estabelecimentos") || "[]");
    locais.push(local);
    localStorage.setItem("incluimais-estabelecimentos", JSON.stringify(locais));
    mensagem.textContent = "Estabelecimento adicionado neste navegador. Abrindo o mapa…";
    window.setTimeout(() => { window.location.href = "index.html?cadastro=concluido"; }, 700);
  } catch {
    mensagem.textContent = "Não foi possível salvar neste navegador. Libere espaço de armazenamento e tente novamente.";
  }
});

export const INITIAL_CHATS = [
  {
    id: 1,
    name: "Sara",
    initials: "S",
    online: true,
    messages: [
      { id: 1, type: "in",  text: "Hola 👋", time: "09:45" },
      { id: 2, type: "out", text: "Hola! Cómo estás?", time: "09:46", status: "read" },
      { id: 3, type: "in",  text: "Todo bien por acá 😊 Y tú?", time: "09:47" },
    ],
  },
  {
    id: 2,
    name: "Luis",
    initials: "L",
    online: false,
    messages: [
      { id: 1, type: "in",  text: "Qué haces esta tarde?", time: "08:30" },
      { id: 2, type: "out", text: "Trabajando todavía 😅", time: "08:45", status: "read"},
    ],
  },
  {
    id: 3,
    name: "Camila",
    initials: "C",
    online: true,
    messages: [
      { id: 1, type: "in", text: "Te mando el link del repo ahora", time: "10:10" },
    ],
  },
  {
    id: 4,
    name: "Andrés",
    initials: "A",
    online: false,
    messages: [
      { id: 1, type: "out", text: "Listo, quedó desplegado 🚀", time: "07:58", status: "read" },
      { id: 2, type: "in",  text: "Perfecto! Gracias 🙌", time: "08:02" },
    ],
  },
  {
    id: 5,
    name: "Valentina",
    initials: "V",
    online: true,
    messages: [
      { id: 1, type: "in", text: "¿Viste el último episodio de la serie?", time: "11:20" },
      { id: 2, type: "out", text: "Sí, estuvo increíble! 😍", time: "11:22", status: "read" },
      { id: 3, type: "in", text: "Totalmente de acuerdo! No puedo esperar para el próximo", time: "11:25" },
    ],
  }
];

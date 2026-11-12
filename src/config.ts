/** Personalizează cadoul aici. Poți folosi și panoul „Personalizează” din joc. */
export const config = {
  recipientName: '',
  senderName: 'un prieten',
  title: "Teemo's Little Birthday Adventure",
  intro: 'Bună, exploratoare! Am pregătit o mică aventură cu surprize, licurici și câteva ciupercuțe… pe care promit că nu le-am pierdut. Pornim?',
  dialogue: {
    mushrooms: 'Misiune îndeplinită! Uneori, cele mai frumoase surprize apar când te aștepți mai puțin!',
    flower: 'Vezi? Chiar și cele mai mici lucruri pot înflori atunci când primesc puțină grijă!',
    paths: 'Fiecare aventurier are propriul drum. Nu contează să știi toate răspunsurile, ci să ai încredere în tine.',
    fireflies: 'Patru licurici, o pădure luminoasă și… dansul meu oficial de explorator! Hopa! Casca e încă la locul ei?',
    compass: 'Un strop de grijă, puțin curaj și lumină. Ai găsit cheia! Busola aceasta e pentru visurile tale.',
    final: 'Surprizăăă! La mulți ani! Am păstrat cea mai frumoasă floare pentru finalul aventurii!',
  },
  messages: {
    mushrooms: 'Îți doresc să ai parte de cât mai multe surprize frumoase, zâmbete sincere și momente care să-ți facă zilele mai bune.',
    flower: 'Să nu uiți să ai grijă și de tine. Meriți timp, liniște și momente în care să faci lucrurile care te bucură.',
    paths: 'Ai voie să mergi în ritmul tău, să te răzgândești și să alegi ceea ce îți aduce liniște. Nu trebuie să ai toate răspunsurile astăzi.',
    firefly1: 'Ești mai puternică decât crezi, chiar și în zilele în care nu simți asta.',
    firefly2: 'Nu uita să te bucuri de lucrurile mici. Uneori ele fac cele mai frumoase amintiri.',
    firefly3: 'Meriți să râzi din suflet, să te simți apreciată și să ai parte de zile liniștite.',
    firefly4: 'Nu trebuie să fii mereu puternică. Uneori e suficient să te oprești și să te bucuri de moment.',
    compass: 'Indiferent câte drumuri apar în viață, sper să găsești mereu direcția care îți aduce bucurie. Ai încredere în tine și nu uita cât de importante sunt propriile tale visuri.',
    final: 'La mulți ani! 🎂🌼\n\nSper ca anul acesta să-ți aducă multe motive să zâmbești, aventuri frumoase, liniște și momente de care să-ți amintești cu drag.\n\nÎți doresc să ai mereu încredere în tine, să te bucuri de lucrurile mici și să nu uiți niciodată să ai grijă de propria fericire.\n\nSper că mica aventură cu Teemo ți-a făcut ziua puțin mai frumoasă.\n\nȘi nu uita... ai grijă pe unde calci, că Teemo a lăsat niște ciuperci peste tot! 🍄😄\n\nLa mulți ani, din partea unui prieten care a vrut să-ți aducă un zâmbet!',
    secret: 'Insigna exploratoarei curioase! Ai găsit fluturașul ascuns. Uneori o mică pauză și un pic de curiozitate fac aventura mai frumoasă.',
  },
};

export type MessageId = keyof typeof config.messages;
export type Personalization = { recipientName: string; senderName: string; messages: Record<MessageId, string> };
export const messageTitles: Record<MessageId, string> = {
  mushrooms: 'Surprizele frumoase', flower: 'Un strop de grijă', paths: 'În ritmul tău',
  firefly1: 'Curajul din tine', firefly2: 'Bucuriile mici', firefly3: 'Zâmbete din suflet', firefly4: 'O clipă de liniște',
  compass: 'Busola visurilor', final: 'O floare de ziua ta', secret: 'O mică surpriză',
};
export const messageIcons: Record<MessageId, string> = {
  mushrooms: '🍄', flower: '🌼', paths: '🧭', firefly1: '✨', firefly2: '✨', firefly3: '✨', firefly4: '✨', compass: '🎁', final: '🌼', secret: '🦋',
};

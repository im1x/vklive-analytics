const axios = require('axios');

const {
  format,
  addDays,
  startOfMonth,
  startOfWeek,
  setDefaultOptions,
  fromUnixTime,
  differenceInDays,
  differenceInHours,
} = require('date-fns');
const { ru } = require('date-fns/locale');

async function fetchUserData(user, limit, offset) {
  try {
    const response = await axios.get(
      `https://api.live.vkvideo.ru/v1/blog/${user}/public_video_stream/record/?limit=${limit}&offset=${offset}`
    );
    const responseData = response.data;
    return responseData.data['records'];
  } catch (error) {
    throw new Error(`Error making the request: ${error.message}`);
  }
}

async function main() {
  try {
    const streamer = 'lasqa';
    let limit = 300,
      offset = 0;
    const jsonArray = [];
    while (true) {
      const data = await fetchUserData(streamer, limit, offset);
      jsonArray.push(...data);
      if (data.length < limit) break;
      offset += limit;
    }

    let totalStreamingTime = 0;
    const startMonitoring = fromUnixTime(
      jsonArray[jsonArray.length - 1].startTime
    );
    //const startMonitoring = new Date("2024-09-16 00:00");
    const endMonitoring = new Date();
    const totalDays = differenceInDays(endMonitoring, startMonitoring);
    const streamingDays = new Map();

    jsonArray.forEach((item) => {
      const startTime = fromUnixTime(item.startTime);
      const dateKey = format(startTime, 'dd.MM.yyyy');
      if (!streamingDays.has(dateKey)) {
        streamingDays.set(dateKey, 1);
      } else {
        streamingDays.set(dateKey, streamingDays.get(dateKey) + 1);
      }
      totalStreamingTime += item.duration;
    });

    console.log(`------------------ ${streamer} ------------------`);
    console.log(
      `С ${format(startMonitoring, 'HH:mm:ss dd.MM.yyyy')} по ${format(
        endMonitoring,
        'HH:mm:ss dd.MM.yyyy'
      )} (${totalDays} дней)`
    );

    // Конвертация секунд в дни и часы
    const totalStreamingDays = totalStreamingTime / (60 * 60 * 24);
    const totalStreamingHours = totalStreamingTime / (60 * 60);
    console.log(
      `Времени простримил: ${totalStreamingDays.toFixed(
        2
      )} дней (или ${totalStreamingHours.toFixed(2)} часов)`
    );

    console.log(
      `Дней со стримами: ${streamingDays.size} (${
        totalDays - streamingDays.size
      } дней без стримов)`
    );

    console.log(
      `Стрим раз в ${(totalDays / streamingDays.size).toFixed(2)} дней`
    );

    console.log(
      `Среднее время стрима: ${(
        totalStreamingHours / streamingDays.size
      ).toFixed(2)} часов`
    );

    console.log(
      `Колличество стримочасов / дни статистика = ${(
        totalStreamingHours / totalDays
      ).toFixed(2)} часа в день (или ${(
        totalStreamingHours /
        (totalDays / 7)
      ).toFixed(2)} часа в неделю)`
    );

    const streamingPercent =
      totalStreamingHours /
      (differenceInHours(endMonitoring, startMonitoring) / 100);
    console.log(
      `Время в % потраченное на стримы: ${streamingPercent.toFixed(2)}% (${(
        100 - streamingPercent
      ).toFixed(2)}% свободного времени)`
    );

    displayYearlyCalendarInRows(2023, [...streamingDays.keys()]);
    displayYearlyCalendarInRows(2024, [...streamingDays.keys()]);
    displayYearlyCalendarInRows(2025, [...streamingDays.keys()]);
  } catch (error) {
    console.error(error.message);
  }
}

function displayYearlyCalendarInRows(year, highlightedDays) {
  setDefaultOptions({ locale: ru });
  console.log(`Год: ${year}\n`);

  const monthNames = [
    '❄️ Январь',
    '❄️ Февраль',
    '🌸 Март',
    '🌸 Апрель',
    '🌸 Май',
    '☀️ Июнь',
    '☀️ Июль',
    '☀️ Август',
    '🍂 Сентябрь',
    '🍂 Октябрь',
    '🍂 Ноябрь',
    '❄️ Декабрь',
  ];

  // Loop through each month, displaying six months per row
  for (let month = 0; month < 12; month += 6) {
    // Print month names for the current row
    for (let i = 0; i < 6 && month + i < 12; i++) {
      const currentMonth = month + i;
      const monthName = monthNames[currentMonth];
      process.stdout.write(`${monthName.padEnd(21)}  `);
    }
    process.stdout.write('\n');

    // Print abbreviated day names for the current row
    const abbreviatedDayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    for (let i = 0; i < 6 && month + i < 12; i++) {
      process.stdout.write(
        abbreviatedDayNames.map((day) => day.padEnd(2)).join(' ') + '   '
      );
    }
    process.stdout.write('\n');

    // Print days for the current row
    const numRows = 6; // Number of rows for days in a month
    for (let row = 0; row < numRows; row++) {
      for (let i = 0; i < 6 && month + i < 12; i++) {
        const currentMonth = month + i;
        const firstDayOfMonth = startOfMonth(new Date(year, currentMonth, 1));
        const startDate = addDays(startOfWeek(firstDayOfMonth), row * 7);

        for (let j = 0; j < 7; j++) {
          const day = startDate.getDate();
          const isHighlighted = highlightedDays.includes(
            format(startDate, 'dd.MM.yyyy')
          );
          let output = '   '; // Default to three spaces
          if (startDate.getMonth() === currentMonth) {
            const dayString = `${day < 10 ? ' ' : ''}${day}`;
            const width = dayString.length;
            output =
              (isHighlighted ? '\x1b[32m' : '') +
              dayString.padEnd(1 + width - 1) +
              (isHighlighted ? '\x1b[0m' : '') +
              ' ';
          }
          process.stdout.write(output);
          startDate.setDate(startDate.getDate() + 1);
        }
        process.stdout.write('  '); // Add extra space between months
      }
      process.stdout.write('\n');
    }
    console.log('\n');
  }
}

main();

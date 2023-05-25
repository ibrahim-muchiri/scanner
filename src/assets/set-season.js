// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function sendPost(seasonId, fixtureDateTime, include) {
  const setDate = {
    seasonId: parseInt(seasonId),
    date_time: fixtureDateTime,
    includeGame: include,
  };
  console.log(setDate);
  const options = {
    method: 'POST',
    body: JSON.stringify(setDate),
    headers: {
      'Content-Type': 'application/json',
    },
  };
  const element = document.getElementById('successToast');
  const myToast = new bootstrap.Toast(element);
  try {
    const response = await fetch('/db-mock', options);
    document.getElementById('toast-message').innerHTML = `${await response.text()}`;
    myToast.show();
  } catch (err) {
    console.error(`Error: ${err}`);
  }
}

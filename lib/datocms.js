export async function request({ query, variables, preview }) {
  let endpoint = 'https://graphql.datocms.com';

  if (process.env.NEXT_DATOCMS_ENVIRONMENT) {
    endpoint += `/environments/${process.env.NEXT_DATOCMS_ENVIRONMENT}`;
  }

  if (preview) {
    endpoint += `/preview`;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_EXAMPLE_CMS_DATOCMS_API_TOKEN}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const body = await response.json();
    if (body.errors) {
      console.error("Ouch! The query has some errors!");
      throw body.errors;
    }

    return body.data;
  } catch (error) {
    console.error('Error fetching data from DatoCMS:', error);
    throw new Error('Failed to fetch data from DatoCMS');
  }
}
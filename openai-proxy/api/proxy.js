export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // Логируем запрос
  console.log('Received request:', request.method, request.url);
  
  // Обрабатываем CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Разрешаем только POST запросы
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ 
      error: 'Only POST requests are allowed' 
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    // Получаем данные из запроса
    const requestBody = await request.json();
    console.log('Request body:', JSON.stringify(requestBody));
    
    // Проверяем наличие Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        error: 'Missing Authorization header' 
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Делаем запрос к OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'User-Agent': 'Vercel-Edge-Function',
      },
      body: JSON.stringify(requestBody),
    });

    // Получаем текст ответа
    const responseText = await openaiResponse.text();
    console.log('OpenAI response status:', openaiResponse.status);
    console.log('OpenAI response:', responseText);

    // Возвращаем ответ клиенту
    return new Response(responseText, {
      status: openaiResponse.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept',
      },
    });

  } catch (error) {
    // Логируем ошибку
    console.error('Proxy error:', error);
    
    // Возвращаем ошибку клиенту
    return new Response(JSON.stringify({
      error: 'Proxy error: ' + error.message,
      details: 'Check server logs for more information'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

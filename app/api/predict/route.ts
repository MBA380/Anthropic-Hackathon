export async function POST(request: Request) {
  try {
    const data = await request.json();

    // Log the received data for debugging
    console.log('Received prediction data:', data);

    // TODO: Replace this with actual Flask backend call
    // For now, return a mock prediction
    // In production, you would call:
    const backendResponse = await fetch('http://localhost:5000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!backendResponse.ok) {
      throw new Error(`Backend returned ${backendResponse.status}`);
    }

    const result = await backendResponse.json();
    return Response.json(result);
  } catch (error) {
    console.error('Prediction error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

    // const mockPrediction = {
    //   prediction: 'Moderate stress level expected',
    //   confidence: 0.85,
    //   recommendations: [
    //     'Consider a short break in the next 30 minutes',
    //     'Increase outdoor time if possible',
    //     'Reduce screen time gradually',
    //     'Ensure adequate nutrition and hydration'
    //   ],
    //   timestamp: new Date().toISOString(),
    // };

//     return Response.json(mockPrediction);
//   } catch (error) {
//     console.error('Error processing prediction:', error);
//     return Response.json(
//       { error: 'Failed to process prediction' },
//       { status: 500 }
//     );
//   }
// }

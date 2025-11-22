import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Received prediction data:', data);

    // Transform frontend format to backend format
    const backendData = {
      sleep_quality_numeric: getSleepQualityNumeric(data.sleepQuality),
      time_numeric: convertTimeToNumeric(data.predictionTime),
      weekday_numeric: new Date().getDay(), // Or get from data if available
      social_context_numeric: getSocialContextNumeric(data.socialInteractionContext),
      transition_type_numeric: getTransitionTypeNumeric(data.transitionType),
      // Calculate time since last meal/void
      time_since_last_meal_min: calculateTimeSince(data.meals?.[0]?.time, data.predictionTime),
      time_since_last_void_min: calculateTimeSince(data.bathroomVisits?.[0]?.time, data.predictionTime),
      recent_accident_flag: data.bathroomVisits?.some((v: any) => v.type === 'accident') ? 1 : 0,
    };

    console.log('Transformed backend data:', backendData);

    const backendResponse = await fetch('http://localhost:5000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backendData),
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      throw new Error(`Backend returned ${backendResponse.status}: ${JSON.stringify(errorData)}`);
    }

    const result = await backendResponse.json();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Prediction error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper functions
function convertTimeToNumeric(time: string): number {
  return parseInt(time.replace(':', ''), 10);
}

function getSleepQualityNumeric(quality: string): number {
  const mapping: { [key: string]: number } = {
    'poor': 1,
    'fair': 2,
    'good': 3,
    'excellent': 4
  };
  return mapping[quality] || 2;
}

function getSocialContextNumeric(context: string): number {
  const mapping: { [key: string]: number } = {
    'alone': 1,
    'family': 2,
    'friends': 3,
    'public': 4
  };
  return mapping[context] || 1;
}

function getTransitionTypeNumeric(transition: string): number {
  const mapping: { [key: string]: number } = {
    'none': 0,
    'minor': 1,
    'major': 2
  };
  return mapping[transition] || 0;
}

function calculateTimeSince(eventTime: string | undefined, currentTime: string): number | null {
  if (!eventTime) return null;

  const [eventHour, eventMin] = eventTime.split(':').map(Number);
  const [currentHour, currentMin] = currentTime.split(':').map(Number);

  const eventMinutes = eventHour * 60 + eventMin;
  const currentMinutes = currentHour * 60 + currentMin;

  return Math.max(0, currentMinutes - eventMinutes);
}










// Previous:
// import { NextResponse } from 'next/server';
//
// export async function POST(request: Request) {
//   try {
//     const data = await request.json();
//
//     // Log the received data for debugging
//     console.log('Received prediction data:', data);
//
//     const backendResponse = await fetch('http://localhost:5000/predict', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify(data),
//     });
//     if (!backendResponse.ok) {
//       throw new Error(`Backend returned ${backendResponse.status}`);
//     }
//
//     const result = await backendResponse.json();
//     return NextResponse.json(result);
//   } catch (error) {
//     console.error('Prediction error:', error);
//     return NextResponse.json(
//       { error: error instanceof Error ? error.message : 'Unknown error' },
//       { status: 500 }
//     );
//   }
// }

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

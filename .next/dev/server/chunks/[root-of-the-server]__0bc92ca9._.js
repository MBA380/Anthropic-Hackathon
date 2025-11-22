module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/app/api/predict/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
async function POST(request) {
    try {
        const data = await request.json();
        // Log the received data for debugging
        console.log('Received prediction data:', data);
        // TODO: Replace this with actual Flask backend call
        // For now, return a mock prediction
        // In production, you would call:
        const backendResponse = await fetch('http://localhost:5000/predict', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!backendResponse.ok) {
            throw new Error(`Backend returned ${backendResponse.status}`);
        }
        const result = await backendResponse.json();
        return Response.json(result);
    } catch (error) {
        console.error('Prediction error:', error);
        return Response.json({
            error: error instanceof Error ? error.message : 'Unknown error'
        }, {
            status: 500
        });
    }
} // const mockPrediction = {
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
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0bc92ca9._.js.map
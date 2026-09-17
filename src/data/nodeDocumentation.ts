import { NodeDocumentation } from '../types';

export const NODE_DOCUMENTATION_REGISTRY: Record<string, NodeDocumentation> = {
  manualTrigger: {
    overview: 'The Manual Trigger initiates workflow execution immediately when the "Test step" or "Execute workflow" button is pressed.',
    usageGuide: 'Use this trigger while prototyping and developing workflows to feed deterministic mock payloads downstream without requiring an external webhook or scheduled event.',
    inputRequirements: 'No upstream input nodes required. Generates an initial JSON item containing payload parameters.',
    outputDescription: 'Emits a single item array containing the evaluated JSON payload object.',
    configurationExamples: [
      {
        title: 'User Profile Test Event',
        description: 'Simulate a user registration or update payload.',
        config: {
          payload: JSON.stringify({
            event: 'user_created',
            timestamp: '2026-09-14T10:00:00Z',
            user: {
              id: 1042,
              name: 'Sarah Connor',
              email: 'sarah@cyberdyne.io',
              plan: 'enterprise'
            }
          }, null, 2)
        },
        sampleOutput: {
          event: 'user_created',
          timestamp: '2026-09-14T10:00:00Z',
          user: { id: 1042, name: 'Sarah Connor', email: 'sarah@cyberdyne.io', plan: 'enterprise' }
        }
      },
      {
        title: 'E-Commerce Order Completed',
        description: 'Trigger an e-commerce order fulfillment pipeline.',
        config: {
          payload: JSON.stringify({
            orderId: 'ORD-9982',
            amount: 450.00,
            currency: 'USD',
            customer: 'alex@example.com',
            itemsCount: 3
          }, null, 2)
        },
        sampleOutput: { orderId: 'ORD-9982', amount: 450.00, currency: 'USD', itemsCount: 3 }
      }
    ],
    tips: [
      'Pin this data in downstream nodes to iterate on parameters without re-running the trigger.',
      'Expressions like {{ $json.user.email }} can access nested payload properties downstream.'
    ],
    externalDocsUrl: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.manualtrigger/'
  },

  webhookTrigger: {
    overview: 'Listens for incoming HTTP requests (POST, GET, PUT, DELETE) and passes headers, query parameters, and body payloads downstream.',
    usageGuide: 'Configure third-party services (GitHub, Stripe, Typeform, Shopify) to deliver webhooks to this unique workflow URL.',
    inputRequirements: 'External network HTTP request sent to the endpoint URL.',
    outputDescription: 'Emits an item with body, headers, query, and params keys.',
    configurationExamples: [
      {
        title: 'Inbound JSON Webhook (POST)',
        description: 'Standard JSON listener returning 200 OK.',
        config: {
          httpMethod: 'POST',
          path: 'inbound-event',
          responseMode: 'onReceived',
          responseData: '{"success": true}'
        },
        sampleOutput: {
          headers: { 'content-type': 'application/json', host: 'nodeflow.studio' },
          body: { action: 'payment_intent.succeeded', customerId: 'cus_N8329' },
          query: { env: 'production' }
        }
      },
      {
        title: 'Immediate Health Check Endpoint (GET)',
        description: 'Responds immediately with service status.',
        config: {
          httpMethod: 'GET',
          path: 'health-check',
          responseMode: 'onReceived',
          responseData: '{"status": "healthy", "service": "nodeflow"}'
        },
        sampleOutput: { status: 'healthy', uptime: 99.98 }
      }
    ],
    tips: [
      'Use responseMode="lastNode" when building synchronous APIs where the workflow calculates the return payload.',
      'Authenticate incoming calls using headers verification or HMAC signatures.'
    ],
    externalDocsUrl: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/'
  },

  httpRequest: {
    overview: 'Sends arbitrary HTTP requests to external APIs with support for REST methods, headers, authentication, query params, and JSON payloads.',
    usageGuide: 'Connect to third-party services or internal microservices. Supports fixed parameters as well as dynamic {{ $json.key }} expressions.',
    inputRequirements: 'Accepts input data items from upstream nodes. Executes once per incoming item by default.',
    outputDescription: 'Returns parsed response JSON (or raw text if not JSON) along with status code and headers.',
    configurationExamples: [
      {
        title: 'Fetch JSON Data (GET)',
        description: 'Query public or authenticated REST endpoints.',
        config: {
          method: 'GET',
          url: 'https://jsonplaceholder.typicode.com/users/1',
          sendHeaders: false
        },
        sampleOutput: {
          id: 1,
          name: 'Leanne Graham',
          email: 'Sincere@april.biz',
          company: { name: 'Romaguera-Crona' }
        }
      },
      {
        title: 'Post Data Payload (POST)',
        description: 'Send JSON body with authorization headers.',
        config: {
          method: 'POST',
          url: 'https://api.example.com/v1/notifications',
          sendHeaders: true,
          bodyParameters: '{\n  "recipient": "{{ $json.email }}",\n  "message": "Welcome aboard!"\n}'
        },
        sampleOutput: { success: true, messageId: 'msg_88192' }
      }
    ],
    tips: [
      'Reference Vault credentials using {{ $vault.MY_SECRET }} to keep tokens out of the workflow definition.',
      'Enable "Continue on Fail" in settings if you want downstream nodes to handle 4xx/5xx HTTP errors.'
    ],
    externalDocsUrl: 'https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/'
  },

  sqlQuery: {
    overview: 'Executes SQL queries against relational databases (PostgreSQL, MySQL, SQLite) to read or persist records.',
    usageGuide: 'Write SELECT, INSERT, UPDATE, or DELETE queries with parameterized inputs to prevent injection attacks.',
    inputRequirements: 'Input items supply variables for parameterized placeholders like $1, $2, or :id.',
    outputDescription: 'Emits rows as individual items or an array of objects representing database query results.',
    configurationExamples: [
      {
        title: 'Fetch Active Users (SELECT)',
        description: 'Query active customers filtered by plan tier.',
        config: {
          operation: 'executeQuery',
          query: "SELECT id, email, created_at, status FROM users WHERE status = 'active' ORDER BY created_at DESC LIMIT 10;"
        },
        sampleOutput: [
          { id: 101, email: 'alex@example.com', status: 'active', created_at: '2026-09-01T08:00:00Z' },
          { id: 102, email: 'elena@example.com', status: 'active', created_at: '2026-09-02T11:30:00Z' }
        ]
      }
    ],
    tips: [
      'Never concatenate raw unsanitized user strings into queries. Use expression parameters or parameterized queries.',
      'Combine with the "UI Data Mapper" to visually map database columns into downstream API calls.'
    ]
  },

  openAiCompletion: {
    overview: 'Generates text, extracts structured JSON, or answers questions using OpenAI GPT models (GPT-4o, GPT-4o-mini).',
    usageGuide: 'Provide a system prompt instructing the model on tone and format, and a user prompt referencing input data.',
    inputRequirements: 'Accepts upstream items to inject into prompts via {{ $json.key }}.',
    outputDescription: 'Returns message content text, model usage token metadata, and finish reason.',
    configurationExamples: [
      {
        title: 'Extract Sentiment & Tags',
        description: 'Categorize incoming customer feedback messages.',
        config: {
          model: 'gpt-4o-mini',
          systemPrompt: 'You are an automated support classifier. Output JSON with sentiment (positive, neutral, negative) and tags array.',
          prompt: 'Customer message: {{ $json.message }}'
        },
        sampleOutput: {
          sentiment: 'positive',
          tags: ['performance', 'onboarding'],
          summary: 'User praised fast setup time.'
        }
      }
    ],
    tips: [
      'Set temperature to 0.0 for deterministic structured outputs or JSON extraction.',
      'Use GPT-4o-mini for cost-effective, high-speed classifications.'
    ]
  },

  geminiAi: {
    overview: 'Executes multimodal and reasoning tasks using Google Gemini 2.5 Flash and Pro models.',
    usageGuide: 'Use Gemini for large context analysis, document processing, code synthesis, and agentic workflows.',
    inputRequirements: 'Input items containing text, markdown, or referenced document URLs.',
    outputDescription: 'Emits generated response text, parsed entities, and safety evaluation ratings.',
    configurationExamples: [
      {
        title: 'Workflow Optimizer & Reasoning',
        description: 'Analyze execution metrics and propose pipeline enhancements.',
        config: {
          model: 'gemini-2.5-flash',
          prompt: 'Review the following order payload and suggest automated fraud risk indicators: {{ $json }}'
        },
        sampleOutput: {
          riskScore: 12,
          recommendation: 'Auto-approve: Verified corporate domain with no velocity anomalies.'
        }
      }
    ],
    tips: [
      'Supports huge context windows for processing entire transaction ledgers or audit logs in one prompt.'
    ]
  },

  codeTransform: {
    overview: 'Runs custom JavaScript or Python scripts to transform, normalize, or aggregate data items.',
    usageGuide: 'Write standard functions accessing `items` and returning an array of `{ json: { ... } }` objects.',
    inputRequirements: 'Receives the array of all incoming items from upstream.',
    outputDescription: 'Whatever array of items your code returns.',
    configurationExamples: [
      {
        title: 'Filter & Calculate Totals',
        description: 'Loop over items and compute an order total.',
        config: {
          language: 'javascript',
          code: `// Loop over input items and add calculated totals\nreturn items.map(item => {\n  const total = (item.json.price || 0) * (item.json.quantity || 1);\n  return {\n    json: {\n      ...item.json,\n      calculatedTotal: total,\n      isHighValue: total > 500\n    }\n  };\n});`
        },
        sampleOutput: [
          { sku: 'A1', price: 299, quantity: 2, calculatedTotal: 598, isHighValue: true }
        ]
      }
    ],
    tips: [
      'Use console.log() to debug values during test step execution.',
      'Always return an array of objects to maintain n8n-compatible downstream pipeline flow.'
    ]
  },

  setFields: {
    overview: 'Creates, renames, or transforms fields on incoming items without writing code.',
    usageGuide: 'Define key-value pairs using either fixed literals or dynamic {{ $json.foo }} expressions.',
    inputRequirements: 'Upstream items containing the fields you wish to map.',
    outputDescription: 'Modified items with newly set or mutated fields.',
    configurationExamples: [
      {
        title: 'Normalize Customer Schema',
        description: 'Map inconsistent customer keys to standard canonical naming.',
        config: {
          keepOnlySet: false,
          values: [
            { name: 'customerEmail', value: '{{ $json.email }}' },
            { name: 'fullName', value: '{{ $json.user.name }}' },
            { name: 'processedAt', value: '{{ $now }}' }
          ]
        },
        sampleOutput: { customerEmail: 'alex@example.com', fullName: 'Alex Mercer', processedAt: '2026-09-14T10:00:00Z' }
      }
    ],
    tips: [
      'Toggle "Keep Only Set Fields" to strip out extraneous raw properties and return a clean payload.'
    ]
  },

  ifElse: {
    overview: 'Splits execution flow into "true" and "false" branches based on conditional comparisons.',
    usageGuide: 'Set up rules comparing values using equals, contains, greater than, or regex matching.',
    inputRequirements: 'Input items whose properties are tested against conditional clauses.',
    outputDescription: 'Emits matching items to the upper (true) port and non-matching items to lower (false) port.',
    configurationExamples: [
      {
        title: 'High-Value Order Routing',
        description: 'Route orders above $500 to priority approval.',
        config: {
          combinator: 'and',
          conditions: [
            { field: '{{ $json.amount }}', operator: 'larger', value: '500' }
          ]
        },
        sampleOutput: { routedBranch: 'true', amount: 750 }
      }
    ],
    tips: [
      'You can add multiple condition rows with AND / OR logic combinators.',
      'Both branch ports can be connected to distinct downstream action nodes.'
    ]
  },

  slackMessage: {
    overview: 'Sends alerts, interactive messages, or attachments to Slack channels or direct messages.',
    usageGuide: 'Connect with a Slack Bot Token or Incoming Webhook URL to deliver automated alerts.',
    inputRequirements: 'Input items supplying message text or metadata.',
    outputDescription: 'Slack API response containing timestamp (ts) and channel ID.',
    configurationExamples: [
      {
        title: 'Order Alert to #sales-notifications',
        description: 'Send formatted alert when an order completes.',
        config: {
          channel: '#sales-alerts',
          message: '🚀 *New Order Received* for *${{ $json.amount }}* from {{ $json.customer }}!'
        },
        sampleOutput: { ok: true, channel: 'C089211', ts: '1726308000.001000' }
      }
    ],
    tips: [
      'Use Slack markdown (*bold*, _italic_, `code`) for readable alert digests.',
      'Mention users using <@U123456> or notify channels with <!channel>.'
    ]
  }
};

/**
 * Returns documentation for any node definition, generating sensible defaults
 * based on parametersSchema if not explicitly defined in the registry.
 */
export function getNodeDocumentation(
  nodeType: string,
  nodeName: string = '',
  category: string = 'action',
  parametersSchema: any[] = []
): NodeDocumentation {
  if (NODE_DOCUMENTATION_REGISTRY[nodeType]) {
    return NODE_DOCUMENTATION_REGISTRY[nodeType];
  }

  // Generate generic documentation dynamically from parameter schema
  const paramNames = parametersSchema.map(p => p.name).filter(Boolean);
  return {
    overview: `The ${nodeName || nodeType} node executes ${category} operations within the S2S pipeline.`,
    usageGuide: `Configure the ${paramNames.slice(0, 3).join(', ')} parameters to interact with this step. Upstream values can be mapped using {{ $json.key }} syntax.`,
    inputRequirements: 'Accepts standard JSON items from connected upstream nodes.',
    outputDescription: 'Emits transformed or newly created JSON items to downstream steps.',
    configurationExamples: [
      {
        title: 'Default Configuration',
        description: `Standard usage example for ${nodeName || nodeType}.`,
        config: parametersSchema.reduce((acc, p) => {
          if (p.default !== undefined) acc[p.name] = p.default;
          return acc;
        }, {} as Record<string, any>),
        sampleOutput: { status: 'success', timestamp: new Date().toISOString() }
      }
    ],
    tips: [
      'Click "Test step" in the header to execute this node in isolation with sample input.',
      'Use expressions to dynamically map values from preceding steps in the pipeline.'
    ]
  };
}

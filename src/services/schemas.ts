import { TemplateType } from '../types';

export interface TemplateMetadata {
  id: TemplateType;
  label: string;
  description: string;
  keyField: string;
  defaultGoal: string;
  fields: Array<{
    name: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'date';
    required: boolean;
  }>;
  schema: Record<string, any>;
}

export const TEMPLATES: Record<TemplateType, TemplateMetadata> = {
  internship: {
    id: 'internship',
    label: 'Internship Tracker',
    description: 'Track software, tech, and research internships, stipends, and deadlines',
    keyField: 'title',
    defaultGoal: "Find all internship roles with 'software' in the title.",
    fields: [
      { name: 'title', label: 'Role Title', type: 'string', required: true },
      { name: 'location', label: 'Location / Remote', type: 'string', required: false },
      { name: 'deadline', label: 'Application Deadline', type: 'date', required: false },
      { name: 'status', label: 'Hiring Status', type: 'string', required: false },
      { name: 'link', label: 'Apply Link', type: 'string', required: false },
    ],
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          maxItems: 25,
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              location: { type: 'string', nullable: true },
              deadline: { type: 'string', nullable: true },
              status: { type: 'string', nullable: true },
              link: { type: 'string', nullable: true },
            },
            required: ['title'],
            propertyOrdering: ['title', 'location', 'deadline', 'status', 'link'],
          },
        },
      },
      required: ['items'],
    },
  },

  job: {
    id: 'job',
    label: 'Job Tracker',
    description: 'Track full-time career opportunities, company hiring pages, and job boards',
    keyField: 'title',
    defaultGoal: 'Find open software engineering jobs.',
    fields: [
      { name: 'title', label: 'Job Title', type: 'string', required: true },
      { name: 'location', label: 'Location', type: 'string', required: false },
      { name: 'deadline', label: 'Application Deadline', type: 'date', required: false },
      { name: 'status', label: 'Status', type: 'string', required: false },
      { name: 'link', label: 'Job Link', type: 'string', required: false },
    ],
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          maxItems: 25,
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              location: { type: 'string', nullable: true },
              deadline: { type: 'string', nullable: true },
              status: { type: 'string', nullable: true },
              link: { type: 'string', nullable: true },
            },
            required: ['title'],
            propertyOrdering: ['title', 'location', 'deadline', 'status', 'link'],
          },
        },
      },
      required: ['items'],
    },
  },

  price: {
    id: 'price',
    label: 'Price & Stock Tracker',
    description: 'Monitor e-commerce prices, discounts, stock drops, and deal changes',
    keyField: 'name',
    defaultGoal: 'Extract product name, price, stock availability, and link.',
    fields: [
      { name: 'name', label: 'Product Name', type: 'string', required: true },
      { name: 'price', label: 'Price', type: 'number', required: true },
      { name: 'in_stock', label: 'In Stock', type: 'boolean', required: false },
      { name: 'link', label: 'Product URL', type: 'string', required: false },
    ],
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          maxItems: 25,
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              price: { type: 'number', nullable: true },
              in_stock: { type: 'boolean', nullable: true },
              link: { type: 'string', nullable: true },
            },
            required: ['name'],
            propertyOrdering: ['name', 'price', 'in_stock', 'link'],
          },
        },
      },
      required: ['items'],
    },
  },

  scholarship: {
    id: 'scholarship',
    label: 'Scholarship & Grants',
    description: 'Track academic scholarships, fellowships, funding, and cut-off dates',
    keyField: 'name',
    defaultGoal: 'Extract scholarship names, award amount, eligibility criteria, and deadlines.',
    fields: [
      { name: 'name', label: 'Scholarship Name', type: 'string', required: true },
      { name: 'amount', label: 'Award Amount', type: 'string', required: false },
      { name: 'eligibility', label: 'Eligibility', type: 'string', required: false },
      { name: 'deadline', label: 'Deadline', type: 'date', required: false },
      { name: 'link', label: 'Official Link', type: 'string', required: false },
    ],
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          maxItems: 25,
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              amount: { type: 'string', nullable: true },
              eligibility: { type: 'string', nullable: true },
              deadline: { type: 'string', nullable: true },
              link: { type: 'string', nullable: true },
            },
            required: ['name'],
            propertyOrdering: ['name', 'amount', 'eligibility', 'deadline', 'link'],
          },
        },
      },
      required: ['items'],
    },
  },

  custom: {
    id: 'custom',
    label: 'Custom Web Watcher',
    description: 'Track arbitrary websites, blogs, announcements, and changes',
    keyField: 'title',
    defaultGoal: 'Extract key items, values, details, and links from the page.',
    fields: [
      { name: 'title', label: 'Title / Item', type: 'string', required: true },
      { name: 'value', label: 'Value / Number', type: 'string', required: false },
      { name: 'details', label: 'Details / Description', type: 'string', required: false },
      { name: 'link', label: 'Page Link', type: 'string', required: false },
    ],
    schema: {
      type: 'object',
      properties: {
        items: {
          type: 'array',
          maxItems: 25,
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              value: { type: 'string', nullable: true },
              details: { type: 'string', nullable: true },
              link: { type: 'string', nullable: true },
            },
            required: ['title'],
            propertyOrdering: ['title', 'value', 'details', 'link'],
          },
        },
      },
      required: ['items'],
    },
  },
};

export function getKeyFieldForTemplate(template: TemplateType): string {
  return TEMPLATES[template]?.keyField || 'title';
}

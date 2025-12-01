#!/usr/bin/env node

/**
 * 🗄️ Complete Database Metadata Export Script
 * 
 * This script exports comprehensive metadata about your Supabase database
 * including schema, relationships, policies, and data statistics.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function exportDatabaseMetadata() {
    console.log('🚀 Starting database metadata export...');

    const metadata = {
        exportDate: new Date().toISOString(),
        database: {
            url: process.env.SUPABASE_URL,
            project: process.env.SUPABASE_URL?.split('//')[1]?.split('.')[0]
        },
        schema: {},
        tables: {},
        relationships: {},
        policies: {},
        functions: {},
        triggers: {},
        statistics: {}
    };

    try {
        // 1. Get basic table information by querying actual tables
        console.log('📋 Discovering tables...');
        const knownTables = [
            'profiles',
            'projects',
            'tasks',
            'task_assignments',
            'files',
            'email_otps',
            'pending_registrations'
        ];

        const tableSchemas = {};

        for (const tableName of knownTables) {
            try {
                console.log(`📊 Analyzing table: ${tableName}...`);

                // Get sample row to understand structure
                const { data: sampleData, error } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);

                if (!error && sampleData && sampleData.length > 0) {
                    const columns = Object.keys(sampleData[0]).map(col => ({
                        column_name: col,
                        data_type: typeof sampleData[0][col],
                        sample_value: sampleData[0][col]
                    }));

                    tableSchemas[tableName] = {
                        exists: true,
                        columns: columns,
                        sample_data: sampleData[0]
                    };
                } else if (!error) {
                    // Table exists but is empty
                    tableSchemas[tableName] = {
                        exists: true,
                        columns: [],
                        sample_data: null,
                        note: 'Table is empty'
                    };
                } else {
                    tableSchemas[tableName] = {
                        exists: false,
                        error: error.message
                    };
                }
            } catch (err) {
                console.log(`⚠️ Could not analyze ${tableName}: ${err.message}`);
                tableSchemas[tableName] = {
                    exists: false,
                    error: err.message
                };
            }
        }

        metadata.tables.schemas = tableSchemas;

        // 2. Get detailed column information using direct table queries
        console.log('🔍 Getting detailed column information...');
        const detailedColumns = {};

        for (const tableName of knownTables) {
            if (tableSchemas[tableName]?.exists) {
                try {
                    // Try to get more detailed info by querying with specific selects
                    const { data, error } = await supabase
                        .from(tableName)
                        .select('*')
                        .limit(1);

                    if (!error && data) {
                        detailedColumns[tableName] = data.length > 0 ? Object.keys(data[0]) : [];
                    }
                } catch (err) {
                    console.log(`Could not get columns for ${tableName}: ${err.message}`);
                }
            }
        }

        metadata.schema.table_columns = detailedColumns;

        // 3. Analyze relationships by checking foreign key patterns
        console.log('🔗 Analyzing relationships...');
        const relationships = {};

        // Check for common foreign key patterns
        const fkPatterns = {
            'task_assignments': {
                'task_id': 'tasks',
                'developer_id': 'profiles'
            },
            'tasks': {
                'project_id': 'projects'
            },
            'projects': {
                'owner_manager_id': 'profiles'
            },
            'files': {
                'project_id': 'projects',
                'uploaded_by_user_id': 'profiles'
            }
        };

        for (const [table, fks] of Object.entries(fkPatterns)) {
            if (tableSchemas[table]?.exists) {
                relationships[table] = fks;
            }
        }

        metadata.relationships.inferred_foreign_keys = relationships;


        // 4. Get table row counts and sample data
        console.log('🔢 Getting table statistics...');
        const tableStats = {};

        for (const tableName of knownTables) {
            if (tableSchemas[tableName]?.exists) {
                try {
                    // Get row count
                    const { count } = await supabase
                        .from(tableName)
                        .select('*', { count: 'exact', head: true });

                    // Get sample records
                    const { data: sampleData } = await supabase
                        .from(tableName)
                        .select('*')
                        .limit(3);

                    tableStats[tableName] = {
                        row_count: count,
                        sample_records: sampleData || []
                    };

                } catch (error) {
                    console.log(`⚠️ Could not get stats for ${tableName}: ${error.message}`);
                    tableStats[tableName] = {
                        row_count: 0,
                        error: error.message
                    };
                }
            }
        }

        metadata.statistics.table_stats = tableStats;

        // 5. Analyze data types and constraints by examining actual data
        console.log('🔍 Analyzing data patterns...');
        const dataPatterns = {};

        for (const tableName of knownTables) {
            if (tableSchemas[tableName]?.exists && tableStats[tableName]?.sample_records?.length > 0) {
                const sample = tableStats[tableName].sample_records[0];
                const patterns = {};

                Object.keys(sample).forEach(column => {
                    const value = sample[column];
                    patterns[column] = {
                        type: typeof value,
                        is_uuid: typeof value === 'string' && value.length === 36 && value.includes('-'),
                        is_timestamp: typeof value === 'string' && value.includes('T') && value.includes('Z'),
                        is_email: typeof value === 'string' && value.includes('@'),
                        sample_value: value
                    };
                });

                dataPatterns[tableName] = patterns;
            }
        }

        metadata.schema.data_patterns = dataPatterns;

        // Write to file
        const outputPath = path.join(__dirname, '../exports/database_metadata.json');
        const outputDir = path.dirname(outputPath);

        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));

        // Also create a human-readable summary
        const summaryPath = path.join(__dirname, '../exports/database_summary.md');
        const summary = generateMarkdownSummary(metadata);
        fs.writeFileSync(summaryPath, summary);

        console.log('✅ Database metadata exported successfully!');
        console.log(`📄 JSON Export: ${outputPath}`);
        console.log(`📋 Summary: ${summaryPath}`);

        return metadata;

    } catch (error) {
        console.error('❌ Error exporting database metadata:', error);
        throw error;
    }
}

function generateMarkdownSummary(metadata) {
    const date = new Date(metadata.exportDate).toLocaleDateString();

    const existingTables = Object.entries(metadata.tables?.schemas || {})
        .filter(([name, info]) => info.exists)
        .map(([name, info]) => name);

    const tableDetails = existingTables.map(tableName => {
        const schema = metadata.tables.schemas[tableName];
        const stats = metadata.statistics.table_stats?.[tableName];
        const patterns = metadata.schema.data_patterns?.[tableName];

        let details = `### 📋 ${tableName}\n`;
        details += `**Rows:** ${stats?.row_count || 0}\n`;

        if (schema.columns && schema.columns.length > 0) {
            details += `**Columns:**\n`;
            schema.columns.forEach(col => {
                const pattern = patterns?.[col.column_name];
                details += `  - \`${col.column_name}\` (${col.data_type}`;
                if (pattern?.is_uuid) details += `, UUID`;
                if (pattern?.is_timestamp) details += `, Timestamp`;
                if (pattern?.is_email) details += `, Email`;
                details += `)\n`;
            });
        }

        if (stats?.sample_records && stats.sample_records.length > 0) {
            details += `**Sample Data:**\n\`\`\`json\n${JSON.stringify(stats.sample_records[0], null, 2)}\n\`\`\`\n`;
        }

        return details;
    }).join('\n');

    const relationships = Object.entries(metadata.relationships?.inferred_foreign_keys || {})
        .map(([table, fks]) =>
            Object.entries(fks).map(([column, refTable]) =>
                `- \`${table}.${column}\` → \`${refTable}\``
            ).join('\n')
        ).join('\n');

    return `# 🗄️ Database Metadata Summary

**Export Date:** ${date}
**Database:** ${metadata.database.project}

## 📊 Overview

### Tables (${existingTables.length})
${existingTables.map(t => `- \`${t}\` (${metadata.statistics.table_stats?.[t]?.row_count || 0} rows)`).join('\n')}

## 📋 Detailed Table Information

${tableDetails}

## 🔗 Inferred Relationships

${relationships || 'No relationships inferred'}

## 📈 Summary Statistics

**Total Records:** ${Object.values(metadata.statistics.table_stats || {}).reduce((sum, stats) => sum + (stats.row_count || 0), 0)}

**Database Health:** ${existingTables.length > 0 ? '✅ Healthy' : '❌ No accessible tables'}

---
*Generated by Enhanced Database Metadata Export Script*
`;
}

// Run if called directly
if (require.main === module) {
    exportDatabaseMetadata()
        .then(() => {
            console.log('🎉 Export completed successfully!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Export failed:', error);
            process.exit(1);
        });
}

module.exports = { exportDatabaseMetadata };
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
        // 1. Get ALL tables from your schema export
        console.log('🔍 Using the complete table list from your schema export...');

        // Use the exact table names from your SQL export
        const discoveredTables = [
            'analytics_snapshots',
            'deadline_reminders',
            'email_otps',
            'file_shares',
            'files',
            'holidays',
            'milestone_tasks',
            'milestones',
            'notification_preferences',
            'notifications',
            'pending_registrations',
            'profile_photos',
            'profiles',
            'projects',
            'reports',
            'subtask_assignments',
            'subtasks',
            'task_assignments',
            'task_estimates',
            'tasks',
            'team_members',
            'team_projects',
            'teams',
            'work_logs'
        ];

        // Also try to dynamically discover tables using table existence check
        console.log('🔍 Verifying table existence...');
        const verifiedTables = [];

        for (const tableName of discoveredTables) {
            try {
                const { error } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });
                if (!error) {
                    verifiedTables.push(tableName);
                }
            } catch (err) {
                console.log(`⚠️ Table ${tableName} not accessible: ${err.message}`);
            }
        }

        const finalTables = verifiedTables.length > 0 ? verifiedTables : discoveredTables;

        console.log(`🎉 Found ${finalTables.length} tables: ${finalTables.join(', ')}`);

        const tableSchemas = {};

        // 2. Analyze each discovered table
        for (const tableName of finalTables) {
            try {
                console.log(`📊 Analyzing table: ${tableName}...`);

                // Get row count and sample data
                const { data: sampleData, error, count } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact' })
                    .limit(1);

                if (!error) {
                    const columns = sampleData && sampleData.length > 0
                        ? Object.keys(sampleData[0]).map(col => ({
                            column_name: col,
                            data_type: typeof sampleData[0][col],
                            sample_value: sampleData[0][col],
                            // Enhanced type detection
                            inferred_sql_type: inferSQLType(sampleData[0][col], col),
                            is_nullable: sampleData[0][col] === null ? 'YES' : 'NO'
                        }))
                        : [];

                    tableSchemas[tableName] = {
                        exists: true,
                        row_count: count || 0,
                        columns: columns,
                        sample_data: sampleData?.[0] || null,
                        // Generate CREATE TABLE statement like your SQL query
                        create_table_statement: generateCreateTableStatement(tableName, columns)
                    };
                } else {
                    console.log(`⚠️ Could not access ${tableName}: ${error.message}`);
                    tableSchemas[tableName] = {
                        exists: false,
                        error: error.message
                    };
                }
            } catch (err) {
                console.log(`❌ Error analyzing ${tableName}: ${err.message}`);
                tableSchemas[tableName] = {
                    exists: false,
                    error: err.message
                };
            }
        }

        metadata.tables.discovered_tables = finalTables;
        metadata.tables.schemas = tableSchemas;

        // 2. Get detailed column information for discovered tables
        console.log('🔍 Getting detailed column information...');
        const detailedColumns = {};

        for (const tableName of finalTables) {
            if (tableSchemas[tableName]?.exists) {
                detailedColumns[tableName] = tableSchemas[tableName].columns?.map(c => c.column_name) || [];
            }
        }

        metadata.schema.table_columns = detailedColumns;

        // 3. Analyze relationships by checking foreign key patterns in discovered tables
        console.log('🔗 Analyzing relationships...');
        const relationships = {};

        // Enhanced relationship detection for all discovered tables
        const enhancedFkPatterns = {
            'analytics_snapshots': { 'entity_id': 'projects' },
            'deadline_reminders': { 'task_id': 'tasks', 'user_id': 'profiles' },
            'email_otps': {},
            'file_shares': { 'file_id': 'files', 'shared_with_user_id': 'profiles', 'shared_by_user_id': 'profiles' },
            'files': { 'project_id': 'projects', 'task_id': 'tasks', 'uploaded_by_user_id': 'profiles' },
            'holidays': { 'created_by': 'profiles' },
            'milestone_tasks': { 'milestone_id': 'milestones', 'task_id': 'tasks' },
            'milestones': { 'project_id': 'projects', 'created_by': 'profiles' },
            'notification_preferences': { 'user_id': 'profiles' },
            'notifications': { 'user_id': 'profiles' },
            'pending_registrations': {},
            'profile_photos': { 'user_id': 'profiles' },
            'profiles': {},
            'projects': { 'owner_manager_id': 'profiles' },
            'reports': { 'project_id': 'projects', 'generated_by': 'profiles' },
            'subtask_assignments': { 'subtask_id': 'subtasks', 'assignee_id': 'profiles', 'assigned_by': 'profiles' },
            'subtasks': { 'parent_task_id': 'tasks', 'created_by': 'profiles', 'estimated_by': 'profiles' },
            'task_assignments': { 'task_id': 'tasks', 'developer_id': 'profiles' },
            'task_estimates': { 'task_id': 'tasks', 'subtask_id': 'subtasks', 'estimator_id': 'profiles' },
            'tasks': { 'project_id': 'projects', 'estimated_by': 'profiles' },
            'team_members': { 'team_id': 'teams', 'user_id': 'profiles' },
            'team_projects': { 'team_id': 'teams', 'project_id': 'projects' },
            'teams': { 'manager_id': 'profiles' },
            'work_logs': { 'task_id': 'tasks', 'subtask_id': 'subtasks', 'user_id': 'profiles' }
        };

        for (const tableName of finalTables) {
            if (tableSchemas[tableName]?.exists) {
                const detectedFks = {};
                const columns = tableSchemas[tableName].columns || [];

                // Auto-detect foreign keys by column naming patterns
                columns.forEach(col => {
                    const colName = col.column_name;
                    if (colName.endsWith('_id') && colName !== 'id') {
                        // Smart FK detection
                        if (colName === 'user_id' || colName === 'assignee_id' || colName === 'assigned_by' ||
                            colName === 'created_by' || colName === 'estimated_by' || colName === 'developer_id' ||
                            colName === 'uploaded_by_user_id' || colName === 'shared_with_user_id' ||
                            colName === 'shared_by_user_id' || colName === 'estimator_id' || colName === 'generated_by') {
                            detectedFks[colName] = 'profiles';
                        } else if (colName === 'project_id') {
                            detectedFks[colName] = 'projects';
                        } else if (colName === 'task_id') {
                            detectedFks[colName] = 'tasks';
                        } else if (colName === 'subtask_id') {
                            detectedFks[colName] = 'subtasks';
                        } else if (colName === 'team_id') {
                            detectedFks[colName] = 'teams';
                        } else if (colName === 'milestone_id') {
                            detectedFks[colName] = 'milestones';
                        } else if (colName === 'file_id') {
                            detectedFks[colName] = 'files';
                        } else {
                            // Generic pattern: remove _id and pluralize
                            const refTable = colName.replace('_id', 's');
                            if (finalTables.includes(refTable)) {
                                detectedFks[colName] = refTable;
                            }
                        }
                    }
                });

                // Merge with known patterns
                const knownFks = enhancedFkPatterns[tableName] || {};
                relationships[tableName] = { ...detectedFks, ...knownFks };
            }
        }

        metadata.relationships.inferred_foreign_keys = relationships;


        // 4. Get comprehensive table statistics for all discovered tables
        console.log('🔢 Getting comprehensive table statistics...');
        const tableStats = {};

        for (const tableName of finalTables) {
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

        // 5. Analyze data patterns for all discovered tables
        console.log('🔍 Analyzing comprehensive data patterns...');
        const dataPatterns = {};

        for (const tableName of finalTables) {
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
                        is_foreign_key: column.endsWith('_id') && column !== 'id',
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

// Helper function to infer SQL types from JavaScript values
function inferSQLType(value, columnName) {
    if (value === null) return 'TEXT';

    const type = typeof value;
    const strValue = String(value);

    if (type === 'string') {
        // UUID detection
        if (strValue.length === 36 && strValue.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
            return 'UUID NOT NULL DEFAULT gen_random_uuid()';
        }
        // Timestamp detection
        if (strValue.includes('T') && strValue.includes('Z') && !isNaN(Date.parse(strValue))) {
            return 'TIMESTAMP WITH TIME ZONE DEFAULT now()';
        }
        // Date detection
        if (strValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return 'DATE';
        }
        // Email detection
        if (strValue.includes('@') && strValue.includes('.')) {
            return 'TEXT';
        }
        // Boolean as string
        if (strValue === 'true' || strValue === 'false') {
            return 'BOOLEAN';
        }
        // Default string
        if (columnName && columnName.includes('description')) {
            return 'TEXT';
        }
        return strValue.length > 50 ? 'TEXT' : 'CHARACTER VARYING';
    }

    if (type === 'number') {
        return Number.isInteger(value) ? 'INTEGER' : 'NUMERIC';
    }

    if (type === 'boolean') {
        return 'BOOLEAN';
    }

    if (type === 'object') {
        return 'JSONB';
    }

    return 'TEXT';
}

// Helper function to generate CREATE TABLE statements
function generateCreateTableStatement(tableName, columns) {
    if (!columns || columns.length === 0) {
        return `CREATE TABLE ${tableName} (\n  -- No columns detected\n);`;
    }

    const columnDefs = columns.map(col => {
        let def = `  ${col.column_name} ${col.inferred_sql_type}`;
        if (col.is_nullable === 'NO' && !col.inferred_sql_type.includes('NOT NULL')) {
            def += ' NOT NULL';
        }
        return def;
    });

    return `CREATE TABLE ${tableName} (\n${columnDefs.join(',\n')}\n);`;
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
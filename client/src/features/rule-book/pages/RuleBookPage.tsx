import { PageHeader } from '../../../core/components/PageHeader';
import { Card, Typography } from 'antd';

const { Title, Text, Paragraph } = Typography;

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card size="small" style={{ marginBottom: 16 }}>
    <Title level={5} style={{ color: 'var(--hrms-primary)', marginBottom: 16 }}>{title}</Title>
    {children}
  </Card>
);

const RuleItem = ({ title, description }: { title: string; description: React.ReactNode }) => (
  <div style={{ marginBottom: 16 }}>
    <Text strong style={{ fontSize: 14 }}>{title}</Text>
    <div style={{ marginTop: 4 }}>{description}</div>
  </div>
);

export function RuleBookPage() {
  return (
    <div style={{ padding: '0 4px' }}>
      <PageHeader 
        title="User Guide" 
        subtitle="System documentation and user manual" 
      />

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        
        <Section title="📊 Overtime Rules">
          <Paragraph>
            Overtime rules define how extra work hours are calculated and limited for employees.
          </Paragraph>
          
          <RuleItem
            title="Multiplier"
            description={
              <Text>
                The multiplier is used to calculate overtime pay rate. For example:<br/>
                • <Text code>1x</Text> = Regular hourly rate<br/>
                • <Text code>1.5x</Text> = 1.5 times regular hourly rate (standard overtime)<br/>
                • <Text code>2x</Text> = Double the regular hourly rate (double overtime)<br/><br/>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Example: If daily wage is ₹800 and multiplier is 1.5x, overtime pay = ₹800 × 1.5 = ₹1,200 per overtime day.
                </Text>
              </Text>
            }
          />

          <RuleItem
            title="Max Hours Per Day"
            description={
              <Text>
                Sets the maximum number of overtime hours that can be claimed in a single day.
                <br/><Text type="secondary" style={{ fontSize: 12 }}>
                  Example: If set to 4 hours, employees cannot claim more than 4 hours of overtime in one day, even if they worked more.
                </Text>
              </Text>
            }
          />

          <RuleItem
            title="Max Hours Per Month"
            description={
              <Text>
                Sets the maximum number of overtime hours an employee can claim in a calendar month.
                <br/><Text type="secondary" style={{ fontSize: 12 }}>
                  Example: If set to 50 hours, even if an employee works 60 overtime hours in a month, only 50 will be counted for payment.
                </Text>
              </Text>
            }
          />
        </Section>

        <Section title="📅 Weekly Off Rules">
          <Paragraph>
            Define which days of the week are considered as weekly off for different employee categories.
          </Paragraph>
          
          <RuleItem
            title="Category"
            description={
              <Text>
                Weekly off rules can be applied to:<br/>
                • <Text code>All</Text> - All employees<br/>
                • <Text code>Workers</Text> - Only manufacturing workers<br/>
                • <Text code>Office Staff</Text> - Only office employees
              </Text>
            }
          />

          <RuleItem
            title="Off Days"
            description={
              <Text>
                Select the days of the week that will be considered off (0 = Sunday, 1 = Monday, etc.).
                Multiple days can be selected for bi-weekly or rotating off schedules.
              </Text>
            }
          />
        </Section>

        <Section title="🎉 Holiday Rules">
          <Paragraph>
            Holidays are days when employees are not required to work and may be eligible for pay.
          </Paragraph>
          
          <RuleItem
            title="Holiday Type"
            description={
              <Text>
                • <Text code>National</Text> - National holidays (Republic Day, Independence Day)<br/>
                • <Text code>State</Text> - State-specific holidays<br/>
                • <Text code>Company</Text> - Company founding day, closure days<br/>
                • <Text code>Festival</Text> - Festival celebrations (Diwali, Holi, Eid, etc.)
              </Text>
            }
          />

          <RuleItem
            title="Applicable To"
            description={
              <Text>
                • <Text code>All</Text> - All employees get this holiday<br/>
                • <Text code>Workers</Text> - Only manufacturing workers<br/>
                • <Text code>Office Staff</Text> - Only office employees
              </Text>
            }
          />

          <RuleItem
            title="Paid vs Unpaid"
            description={
              <Text>
                <Text code>Paid</Text> holiday means employee receives full salary for that day.<br/>
                <Text code>Unpaid</Text> holiday does not count towards salary but is still a holiday.
              </Text>
            }
          />
        </Section>

        <Section title="👥 Attendance Status">
          <Paragraph>
            Different statuses for marking employee attendance:
          </Paragraph>
          
          <RuleItem
            title="Present"
            description={<Text>Employee worked the full scheduled shift.</Text>}
          />
          <RuleItem
            title="Absent"
            description={<Text>Employee did not report to work without leave approval.</Text>}
          />
          <RuleItem
            title="Half Day"
            description={<Text>Employee worked only half of the scheduled shift.</Text>}
          />
          <RuleItem
            title="Leave"
            description={<Text>Employee was on approved leave (casual, sick, earned, etc.).</Text>}
          />
          <RuleItem
            title="Weekly Off"
            description={<Text>Employee was on scheduled weekly off day.</Text>}
          />
          <RuleItem
            title="Holiday"
            description={<Text>Day was a company holiday.</Text>}
          />
        </Section>

        <Section title="💼 Employee Categories">
          <Paragraph>
            Employees are categorized for applying different policies:
          </Paragraph>
          
          <RuleItem
            title="Manufacturing Worker"
            description={
              <Text>
                Workers on the production floor. They typically:<br/>
                • Have daily wage rates<br/>
                • Work in shifts<br/>
                • May have different overtime rules
              </Text>
            }
          />

          <RuleItem
            title="Office Staff"
            description={
              <Text>
                Administrative and support staff. They typically:<br/>
                • Have monthly salary<br/>
                • Fixed working hours<br/>
                • Different leave policies
              </Text>
            }
          />
        </Section>

        <Section title="📋 Employment Types">
          <Paragraph>
            Types of employment contracts:
          </Paragraph>
          
          <RuleItem
            title="Permanent"
            description={<Text>Full-time employees with regular salary and benefits.</Text>}
          />
          <RuleItem
            title="Contract"
            description={<Text>Employees hired for a specific period or project.</Text>}
          />
          <RuleItem
            title="Temporary"
            description={<Text>Short-term employees for seasonal or peak work.</Text>}
          />
          <RuleItem
            title="Trainee"
            description={<Text>Employees undergoing training period before permanent placement.</Text>}
          />
        </Section>

        <Section title="⚙️ Company Settings">
          <Paragraph>
            Configure company information and system-wide policies.
          </Paragraph>
          
          <RuleItem
            title="Payroll Configuration"
            description={
              <Text>
                • <Text code>Overtime Base</Text> - Calculate OT on Basic Salary or Basic + Allowances<br/>
                • <Text code>Overtime Multiplier</Text> - Rate multiplier for OT calculation<br/>
                • <Text code>Half Day Deduction %</Text> - Percentage deducted for half-day absence<br/>
                • <Text code>Default Working Days</Text> - Standard working days in a month (usually 26)<br/>
                • <Text code>Standard Hours/Day</Text> - Normal working hours (usually 8)<br/>
                • <Text code>Paid Weekly Off</Text> - Whether weekly offs are paid<br/>
                • <Text code>Paid Holidays</Text> - Whether holidays are included in salary
              </Text>
            }
          />

          <RuleItem
            title="Allowances"
            description={
              <Text>
                Default allowances added to employee salary:<br/>
                • <Text code>HRA</Text> - House Rent Allowance (usually % of basic)<br/>
                • <Text code>DA</Text> - Dearness Allowance (usually % of basic)<br/>
                • <Text code>Transport Allowance</Text> - Fixed amount for commute<br/>
                • <Text code>Food Allowance</Text> - Fixed amount for meals
              </Text>
            }
          />
        </Section>

        <Section title="💰 Payroll Process">
          <Paragraph>
            How monthly salary is calculated and processed:
          </Paragraph>
          
          <RuleItem
            title="Running Payroll"
            description={
              <Text>
                1. Select month and year<br/>
                2. System fetches all active employees<br/>
                3. Calculates attendance (present, absent, half-day, leave, weekly-off, holidays)<br/>
                4. Adds overtime hours and calculates OT pay<br/>
                5. Applies allowances and deductions<br/>
                6. Generates net pay for each employee
              </Text>
            }
          />

          <RuleItem
            title="Payroll Status"
            description={
              <Text>
                • <Text code>Draft</Text> - Payroll processed but not finalized, can be modified<br/>
                • <Text code>Finalized</Text> - Payroll locked, cannot be changed, salary slips generated
              </Text>
            }
          />

          <RuleItem
            title="Salary Slip"
            description={
              <Text>
                Once payroll is finalized, salary slips can be generated containing:<br/>
                • Employee details (name, code, department, designation)<br/>
                • Basic salary and earnings<br/>
                • Deductions (absences, late marks)<br/>
                • Overtime pay<br/>
                • Net payable amount
              </Text>
            }
          />
        </Section>

      </div>
    </div>
  );
}
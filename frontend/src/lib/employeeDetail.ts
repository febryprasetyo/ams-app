export const employeeDetailGroups = [
  { title: 'Data pekerjaan', fields: [
    ['employeeCode', 'Employee ID'], ['fullName', 'Full Name'], ['barcode', 'Barcode'], ['departmentName', 'Organization'], ['position', 'Job Position'], ['jobLevel', 'Job Level'], ['joinDate', 'Join Date'], ['employmentStatus', 'Status Employee'], ['email', 'Email'],
  ] },
  { title: 'Data pribadi dan kontak', fields: [
    ['birthDate', 'Birth Date'], ['age', 'Age'], ['birthPlace', 'Birth Place'], ['citizenIdAddress', 'Citizen ID Address'], ['residentialAddress', 'Residential Address'], ['mobilePhone', 'Mobile Phone'], ['secondaryPhone', 'Phone'], ['religion', 'Religion'], ['gender', 'Gender'], ['maritalStatus', 'Marital Status'], ['bloodType', 'Blood Type'], ['nationalityCode', 'Nationality Code'],
  ] },
  { title: 'Pajak, bank, dan kepesertaan', fields: [
    ['npwp', 'NPWP'], ['ptkpStatus', 'PTKP Status'], ['employeeTaxStatus', 'Employee Tax Status'], ['bankName', 'Bank Name'], ['bankAccount', 'Bank Account'], ['bankAccountHolder', 'Bank Account Holder'], ['bpjsKetenagakerjaan', 'BPJS Ketenagakerjaan'], ['bpjsKesehatan', 'BPJS Kesehatan'], ['nikKtp', 'NIK (NPWP 16 Digit)'], ['currency', 'Currency'], ['lengthOfService', 'Length Of Service'], ['npwp16Digit', 'NPWP 16 digit (new)'],
  ] },
].map(group => ({ ...group, fields: group.fields.map(([key, label]) => ({ key, label })) }));

export function formatEmployeeValue(value: unknown): string {
  return value === null || value === undefined || value === '' ? 'Belum diisi' : String(value);
}

import pandas as pd, json

df = pd.read_excel('DEX_ROI_KPI_Calculator_With_Consolidated.xlsx')
# Rename columns for json clarity
df_json = df[['#','KPI (Category)','Type','Tier','Primary Persona(s)',"Typical Q-Trend You'll Track",'Key Inputs (Baseline)','ROI / Improvement Formula']]
records = df_json.to_dict(orient='records')
# Save json string to variable
data_json_str = json.dumps(records, indent=2)
print(data_json_str[:1000])
print('\n... total records:', len(records))
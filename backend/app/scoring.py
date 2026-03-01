from openai import OpenAI
from dotenv import load_dotenv
import os
import json

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def score_lead(contact: dict, lead: dict) -> dict:
    prompt = f"""
    You are an AI lead scoring assistant for a dental practice CRM.
    
    Analyze this lead and return a JSON score object.
    
    Contact Information:
    - Name: {contact.get('name')}
    - Source: {contact.get('source')}
    - Company: {contact.get('company')}
    
    Lead Information:
    - Notes: {lead.get('notes')}
    - Value Estimate: ${lead.get('value_estimate')}
    - Current Status: {lead.get('status')}
    
    Score this lead from 0-100 based on:
    1. Urgency indicators in the notes (emergency = high score)
    2. Value of the potential deal
    3. Quality of the lead source
    4. How specific and detailed the notes are
    
    Return ONLY a JSON object in this exact format, nothing else:
    {{
        "score": <number 0-100>,
        "priority": "<high|medium|low>",
        "reasoning": "<one sentence explanation>",
        "recommended_action": "<specific next step to take>"
    }}
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        
        result = response.choices[0].message.content.strip()
        result = result.replace("```json", "").replace("```", "").strip()
        scored = json.loads(result)
        return scored
        
    except Exception as e:
        print(f"SCORING ERROR: {e}")
        return {
            "score": 50,
            "priority": "medium",
            "reasoning": "Unable to score lead automatically",
            "recommended_action": "Review lead manually"
        }


def score_leads_batch(leads_with_contacts: list) -> list:
    results = []
    for item in leads_with_contacts:
        score_data = score_lead(item['contact'], item['lead'])
        results.append({
            "lead_id": item['lead']['id'],
            "contact_name": item['contact']['name'],
            **score_data
        })
    results.sort(key=lambda x: x['score'], reverse=True)
    return results
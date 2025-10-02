export type CategoryNode = {
    label: string;
    selectable?: boolean;
    children?: CategoryNode[];
  };
  
  export type CategorySelectProps = {
    value: string[];
    onChange: (value: string[]) => void;
  };
  
  export const categories: CategoryNode[] = [
    { label: "University Activities", selectable: true },
    {
      label: "Enhance Competencies",
      selectable: false,
      children: [
        { label: "Development of Morality and Ethics", selectable: true },
        { label: "Development of Thinking and Learning Skills", selectable: true },
        { label: "Development of Interpersonal Skills and Relationship Building", selectable: true },
        { label: "Development of Health and Well-being", selectable: true },
      ],
    },
    { label: "Social Engagement Activities", selectable: true },
  ];
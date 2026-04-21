'use client'
// Story 87.4 — Route dédiée "+ Nouveau manager"
import { NewPersonForm } from '../../_components/NewPersonForm'

export default function NewManagerPage() {
  return <NewPersonForm role={'manager'} />
}
